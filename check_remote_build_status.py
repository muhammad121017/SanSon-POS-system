import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # Check if there is active docker build process running
    stdin, stdout, stderr = client.exec_command("ps aux | grep -i 'docker' | grep -v grep")
    print("--- Active Docker Processes ---")
    print(stdout.read().decode())
    
    # Check currently running containers
    stdin, stdout, stderr = client.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.RunningFor}}'")
    print("--- Running Containers ---")
    print(stdout.read().decode())

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
