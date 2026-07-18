import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # 1. Inspect sansons_frontend labels
    stdin, stdout, stderr = client.exec_command("docker inspect sansons_frontend --format '{{json .Config.Labels}}'")
    print("--- frontend Labels ---")
    print(stdout.read().decode())
    
    # 2. Inspect sansons_frontend networks
    stdin, stdout, stderr = client.exec_command("docker inspect sansons_frontend --format '{{json .NetworkSettings.Networks}}'")
    print("--- frontend Networks ---")
    print(stdout.read().decode())
    
    # 3. Check logs of sansons_backend
    stdin, stdout, stderr = client.exec_command("docker logs --tail 30 sansons_backend")
    print("--- backend Logs ---")
    print(stdout.read().decode())
    print("Errors:")
    print(stderr.read().decode())
    
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
