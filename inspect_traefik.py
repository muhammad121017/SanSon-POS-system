import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # Check docker containers
    stdin, stdout, stderr = client.exec_command("docker ps")
    print("--- Running Docker Containers ---")
    print(stdout.read().decode())
    
    # Check docker networks
    stdin, stdout, stderr = client.exec_command("docker network ls")
    print("--- Docker Networks ---")
    print(stdout.read().decode())
    
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
