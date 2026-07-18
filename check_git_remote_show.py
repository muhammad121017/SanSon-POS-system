import paramiko
import subprocess

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

print("=== Local Remote Show ===")
res = subprocess.run(["git", "remote", "show", "origin"], capture_output=True, text=True)
print(res.stdout)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("\n=== Remote VPS Show ===")
    stdin, stdout, stderr = client.exec_command("cd /docker/sansonspos && git remote show origin")
    print(stdout.read().decode())
    print(stderr.read().decode())
    
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
