import urllib.request
import ssl
import json

url = "https://sansons.shop/api/inventory/dashboard/"
print(f"Requesting {url}...")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with urllib.request.urlopen(url, context=ctx, timeout=10) as response:
        print(f"HTTP Status: {response.status}")
        data = json.loads(response.read().decode('utf-8'))
        print("Response received successfully!")
        print(json.dumps(data, indent=2)[:500])
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
