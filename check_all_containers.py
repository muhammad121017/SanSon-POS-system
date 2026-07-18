import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # Check all containers
    stdin, stdout, stderr = client.exec_command("docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.State}}'")
    print("--- All Containers ---")
    print(stdout.read().decode())
    
    # Check compose logs
    print("--- Recent Docker Compose Logs ---")
    stdin, stdout, stderr = client.exec_command("cd /docker/sansonspos && docker compose logs --tail 30")
    print(stdout.read().decode())

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
