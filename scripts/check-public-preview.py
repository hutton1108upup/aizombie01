"""Verify the deployed preview with normal TLS validation and no credentials."""
import json
import re
import urllib.request
from urllib.parse import urljoin

for base in (
    'https://aizombietrend.video',
    'https://aizombie01.duckweed1014.workers.dev',
):
    for path in ('/', '/pricing', '/ai-zombie-trend', '/zh', '/robots.txt', '/sitemap.xml'):
        with urllib.request.urlopen(base + path, timeout=30) as response:
            assert response.status == 200, (base, path, response.status)
            body = response.read().decode('utf-8')
            if path == '/':
                assert 'AI Zombie' in body, 'Incorrect project served'
                assert 'https://aizombietrend.video' in body, 'Missing production URL'
                assets = re.findall(r'(?:src|href)="([^" ]+/assets/[^" ]+|/assets/[^" ]+)"', body)
                assert assets, 'No built assets found'
                for asset in assets[:2]:
                    with urllib.request.urlopen(urljoin(base, asset), timeout=30) as asset_response:
                        assert asset_response.status == 200
            print(f'{base}{path}: 200')
    with urllib.request.urlopen(base + '/api/ping', timeout=30) as response:
        assert json.load(response) == {'message': 'pong'}
    with urllib.request.urlopen(base + '/api/auth/get-session', timeout=30) as response:
        assert json.load(response) is None
    with urllib.request.urlopen(base + '/dashboard', timeout=30) as response:
        assert response.url == base + '/', response.url
    print(f'{base}: TLS, assets, health, anonymous session and private redirect passed')
