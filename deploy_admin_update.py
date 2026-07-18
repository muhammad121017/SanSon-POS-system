import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to VPS {hostname}...")
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # Run git pull and restart containers
    print("Pulling latest code and restarting backend container...")
    cmd = "cd /docker/sansonspos && git reset --hard && git pull origin main && docker compose restart backend"
    stdin, stdout, stderr = client.exec_command(cmd)
    
    # Read output
    print("STDOUT:")
    print(stdout.read().decode('utf-8', errors='ignore'))
    print("STDERR:")
    print(stderr.read().decode('utf-8', errors='ignore'))
    
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
