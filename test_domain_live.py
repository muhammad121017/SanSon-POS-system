import urllib.request
import ssl

url = "https://sansons.shop"
print(f"Requesting {url}...")

# Ignore SSL verification issues just in case the certificate is still generating
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with urllib.request.urlopen(url, context=ctx, timeout=10) as response:
        html = response.read().decode('utf-8')
        print(f"HTTP Status: {response.status}")
        print("First 200 characters of response:")
        print(html[:200])
except Exception as e:
    print(f"Error connecting: {e}")
