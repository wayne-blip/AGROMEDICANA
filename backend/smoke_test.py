import urllib.request
import urllib.error
import json

BASE = 'http://127.0.0.1:5000'


def request(method, path, body=None):
    url = BASE + path
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            resp = r.read().decode('utf-8')
            try:
                return json.loads(resp)
            except Exception:
                return {'raw': resp}
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode('utf-8')
            return {'http_error': e.code, 'body': json.loads(body) if body else body}
        except Exception:
            return {'http_error': e.code, 'body': str(e)}
    except Exception as e:
        return {'error': str(e)}


if __name__ == '__main__':
    tests = [
        ('GET', '/api/v1/dashboard/data', None),
        ('GET', '/api/v1/experts', None),
        ('POST', '/api/v1/auth/login', {'username': 'client1', 'password': 'password'}),
        ('POST', '/api/v1/consultations', {'client_id': 1, 'expert_id': 3, 'topic': 'Aquaculture consult'})
    ]

    for method, path, body in tests:
        print('\n--- {} {} ---'.format(method, path))
        res = request(method, path, body)
        print(json.dumps(res, indent=2, ensure_ascii=False))
