import paramiko
import time

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to VPS {hostname}...")
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # 1. Pull latest code from GitHub
    print("Pulling latest code from GitHub...")
    stdin, stdout, stderr = client.exec_command("cd /docker/sansonspos && git reset --hard && git clean -fd && git pull origin main")
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    # 2. Stop running containers to free up resources/ports if needed
    print("Stopping current containers...")
    client.exec_command("cd /docker/sansonspos && docker compose down")
    time.sleep(5)
    
    # 3. Build and spin up containers in background
    print("Rebuilding and starting containers (this might take 1-2 minutes)...")
    stdin, stdout, stderr = client.exec_command("cd /docker/sansonspos && docker compose up --build -d")
    
    # Wait and check progress
    time.sleep(20)
    print("Checking container status:")
    stdin, stdout, stderr = client.exec_command("docker ps | grep -E 'pos_'")
    print(stdout.read().decode())
    
    print("Checking backend logs to verify migrations and startup:")
    stdin, stdout, stderr = client.exec_command("docker logs pos_backend")
    print(stdout.read().decode())

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
