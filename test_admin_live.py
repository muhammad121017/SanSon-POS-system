import urllib.request
import ssl

url = "https://sansons.shop/admin/login/"
print(f"Requesting {url}...")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with urllib.request.urlopen(url, context=ctx, timeout=10) as response:
        print(f"HTTP Status: {response.status}")
        html = response.read().decode('utf-8')
        print("Success! Admin login page loads perfectly.")
        print(f"Contains 'Django administration': {'Django administration' in html}")
except Exception as e:
    print(f"Error: {e}")
