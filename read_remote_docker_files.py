import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # Read docker-compose.yml
    stdin, stdout, stderr = client.exec_command("cat /docker/sansonspos/docker-compose.yml")
    print("--- /docker/sansonspos/docker-compose.yml ---")
    print(stdout.read().decode())
    
    # Read .env
    stdin, stdout, stderr = client.exec_command("cat /docker/sansonspos/.env")
    print("--- /docker/sansonspos/.env ---")
    print(stdout.read().decode())
    
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
