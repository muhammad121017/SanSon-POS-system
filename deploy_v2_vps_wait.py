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
    
    # Run the build and wait for it
    print("Starting docker compose build & start, waiting for completion...")
    cmd = "cd /docker/sansonspos && docker compose up --build -d"
    stdin, stdout, stderr = client.exec_command(cmd)
    
    # Read output line by line to keep connection alive and monitor progress
    while True:
        line = stdout.readline()
        if not line:
            break
        print(f"[STDOUT] {line.strip()}")
        
    # Read errors if any
    err_output = stderr.read().decode()
    if err_output:
        print("--- stderr output ---")
        print(err_output)
        
    print("\nChecking container status after build:")
    stdin, stdout, stderr = client.exec_command("docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.State}}'")
    print(stdout.read().decode())

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
