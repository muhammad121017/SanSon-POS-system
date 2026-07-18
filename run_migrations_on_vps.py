import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # 1. Generate migrations
    print("Generating Django migrations inside the container...")
    stdin, stdout, stderr = client.exec_command("docker exec pos_backend python manage.py makemigrations")
    print("STDOUT:")
    print(stdout.read().decode())
    print("STDERR:")
    print(stderr.read().decode())
    
    # 2. Run migrations
    print("Applying Django migrations on MySQL database...")
    stdin, stdout, stderr = client.exec_command("docker exec pos_backend python manage.py migrate")
    print("STDOUT:")
    print(stdout.read().decode())
    print("STDERR:")
    print(stderr.read().decode())

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
