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
    
    # Run git pull and docker compose up
    print("Pulling latest code and restarting containers...")
    cmd = "cd /docker/sansonspos && git pull origin main && docker compose up -d"
    stdin, stdout, stderr = client.exec_command(cmd)
    
    # Read outputs
    print("STDOUT:")
    print(stdout.read().decode())
    print("STDERR:")
    print(stderr.read().decode())
    
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
