"""Verify the deployed preview with normal TLS validation and no credentials."""
import json
import re
import urllib.request
from urllib.error import HTTPError
from urllib.parse import urljoin

def open_url(url):
    request = urllib.request.Request(url, headers={
        'User-Agent': 'AIZombie-Deployment-Check/1.0',
        'Accept': 'text/html,application/json,application/xml,*/*',
    })
    try:
        return urllib.request.urlopen(request, timeout=30)
    except HTTPError as error:
        print(f'{url}: HTTP {error.code}; headers={dict(error.headers)}', flush=True)
        print(error.read(2000).decode('utf-8', errors='replace'), flush=True)
        raise

for base in (
    'https://aizombietrend.video',
    'https://aizombie01.duckweed1014.workers.dev',
):
    for path in ('/', '/pricing', '/ai-zombie-trend', '/zh', '/robots.txt', '/sitemap.xml'):
        with open_url(base + path) as response:
            assert response.status == 200, (base, path, response.status)
            body = response.read().decode('utf-8')
            if path == '/':
                assert 'AI Zombie' in body, 'Incorrect project served'
                assert 'https://aizombietrend.video' in body, 'Missing production URL'
                assets = re.findall(r'(?:src|href)="([^" ]+/assets/[^" ]+|/assets/[^" ]+)"', body)
                assert assets, 'No built assets found'
                for asset in assets[:2]:
                    with open_url(urljoin(base, asset)) as asset_response:
                        assert asset_response.status == 200
            print(f'{base}{path}: 200')
    with open_url(base + '/api/ping') as response:
        assert json.load(response) == {'message': 'pong'}
    with open_url(base + '/api/auth/get-session') as response:
        assert json.load(response) is None
    with open_url(base + '/dashboard') as response:
        assert response.url == base + '/', response.url
    print(f'{base}: TLS, assets, health, anonymous session and private redirect passed')
