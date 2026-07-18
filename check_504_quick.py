import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # 1. docker ps
    print("\n=== docker ps ===")
    stdin, stdout, stderr = client.exec_command("docker ps")
    print(stdout.read().decode())
    
    # 2. backend logs
    print("\n=== backend logs ===")
    stdin, stdout, stderr = client.exec_command("docker logs --tail 40 pos_backend")
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    # 3. frontend logs
    print("\n=== frontend logs ===")
    stdin, stdout, stderr = client.exec_command("docker logs --tail 20 pos_frontend")
    print(stdout.read().decode())
    print(stderr.read().decode())

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
