import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # 1. Check if pos_frontend can ping backend
    print("\n=== Resolving backend from frontend container ===")
    stdin, stdout, stderr = client.exec_command("docker exec pos_frontend ping -c 2 backend")
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    # 2. Check if pos_frontend can connect to backend:8000
    print("\n=== Curl test from frontend to backend ===")
    stdin, stdout, stderr = client.exec_command("docker exec pos_frontend wget -qO- http://backend:8000/api/inventory/products/")
    print(stdout.read().decode()[:300])
    print(stderr.read().decode())
    
    # 3. Check Traefik logs for the 504 error
    print("\n=== Traefik Logs for Gateway Timeout ===")
    stdin, stdout, stderr = client.exec_command("docker logs n8n-traefik-1 2>&1 | grep -i -E 'sansons|timeout' | tail -20")
    print(stdout.read().decode())
    
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
