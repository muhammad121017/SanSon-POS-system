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
    
    # 1. Reset Git repository on VPS to match GitHub main branch
    print("Resetting local repository on VPS to origin/main...")
    cmd_git = "cd /docker/sansonspos && git fetch origin && git reset --hard origin/main"
    stdin, stdout, stderr = client.exec_command(cmd_git)
    print("STDOUT:")
    print(stdout.read().decode())
    print("STDERR:")
    print(stderr.read().decode())
    
    # 2. Rebuild and launch containers with the clean repository
    print("Rebuilding and starting containers with the clean repository...")
    cmd_docker = "cd /docker/sansonspos && docker compose up --build -d"
    stdin, stdout, stderr = client.exec_command(cmd_docker)
    
    # Read output line-by-line safely
    while True:
        line_bytes = stdout.readline()
        if not line_bytes:
            break
        try:
            sys.stdout.buffer.write(line_bytes.encode('utf-8', errors='replace') + b'\n')
            sys.stdout.flush()
        except Exception:
            print("[STDOUT LOG CONVERSION ERROR]")
            
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
