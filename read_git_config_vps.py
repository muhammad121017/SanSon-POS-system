import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    stdin, stdout, stderr = client.exec_command("cat /docker/sansonspos/.git/config")
    print("--- Git Config ---")
    print(stdout.read().decode())
    
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
