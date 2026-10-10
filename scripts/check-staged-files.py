"""Check the exact Git index; print file locations, never credential values."""
import json
import re
import subprocess
from pathlib import Path

def git(*args):
    return subprocess.check_output(['git', *args])

paths = git('diff', '--cached', '--name-only', '-z').decode('utf-8').split('\0')
paths = [path for path in paths if path]
allowed_env = {'.env.example', '.env.production.example'}
private_prefixes = (
    'node_modules/', 'dist/', 'dist-ssr/', 'outputs/', '自用/', '.workbuddy/',
    '.wrangler/', '.tanstack/', '.content-collections/', 'test-results/',
    'playwright-report/', '.vscode/', 'src/locale/paraglide/', 'project.inlang/cache/',
)
findings = []
for path in paths:
    name = Path(path).name
    if path.startswith(private_prefixes) or (name.startswith('.env') and path not in allowed_env) or name.startswith('.dev.vars') or name.endswith(('.pem', '.key', '.p12', '.pfx', '.mp4')):
        findings.append({'file': path, 'reason': 'private or generated file'})

# Compare only non-placeholder, project-local secret values. Never print them.
secrets = []
for file in ('.env', '.env.local', '.env.production', '.dev.vars'):
    if not Path(file).exists():
        continue
    for line in Path(file).read_text(encoding='utf-8').splitlines():
        match = re.match(r'([A-Z0-9_]*(?:SECRET|TOKEN|PRIVATE_KEY|API_KEY|FAL_KEY)[A-Z0-9_]*)\s*=\s*(.*)', line)
        if match:
            value = match.group(2).strip().strip('\"\'')
            if len(value) >= 16 and not re.search(r'example|placeholder|e2e-|local-preview|your[_-]|change.?me', value, re.I):
                secrets.append(value.encode())

patterns = [
    re.compile(rb'\bgh[pousr]_[A-Za-z0-9]{30,}'),
    re.compile(rb'\bgithub_pat_[A-Za-z0-9_]{40,}'),
    re.compile(rb'\bsk_live_[A-Za-z0-9]{20,}'),
    re.compile(rb'-----BEGIN (?:RSA )?PRIVATE KEY-----\s+[A-Za-z0-9+/=\s]{100,}-----END'),
]
total = 0
for path in paths:
    content = git('show', ':' + path)
    total += len(content)
    if b'\0' in content:
        continue
    if any(secret in content for secret in secrets):
        findings.append({'file': path, 'reason': 'matches a local secret'})
    for pattern in patterns:
        if pattern.search(content):
            findings.append({'file': path, 'reason': 'credential-shaped content; inspect locally'})

report = {'staged_files': len(paths), 'staged_bytes': total, 'findings': findings}
Path('outputs').mkdir(exist_ok=True)
Path('outputs/staged-file-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False))
raise SystemExit(1 if findings else 0)
