import paramiko
import sys

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
    cmd = "cd /docker/sansonspos && git reset --hard && git pull origin main && docker compose up --build -d"
    stdin, stdout, stderr = client.exec_command(cmd)
    
    # Read output line by line safely handling non-ASCII characters
    while True:
        line_bytes = stdout.readline()
        if not line_bytes:
            break
        try:
            # Print safely to sys.stdout using utf-8 or errors replace
            sys.stdout.buffer.write(line_bytes.encode('utf-8', errors='replace') + b'\n')
            sys.stdout.flush()
        except Exception:
            print("[STDOUT LOG LINE CONVERSION ERROR]")
        
    print("stderr:")
    print(stderr.read().decode('utf-8', errors='ignore'))
    
    # Check final status
    print("\n--- Current Containers Status ---")
    stdin, stdout, stderr = client.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.State}}'")
    print(stdout.read().decode())

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
