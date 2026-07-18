import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # Check git status
    print("--- Git Status ---")
    stdin, stdout, stderr = client.exec_command("cd /docker/sansonspos && git status")
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    # Check running docker compose processes
    print("--- Docker Processes ---")
    stdin, stdout, stderr = client.exec_command("ps aux | grep -i 'docker' | grep -v grep")
    print(stdout.read().decode())

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
