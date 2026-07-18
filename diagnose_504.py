import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")

    # 1. Backend logs
    print("\n--- pos_backend logs (last 40 lines) ---")
    stdin, stdout, stderr = client.exec_command("docker logs pos_backend 2>&1 | tail -40")
    print(stdout.read().decode())

    # 2. Frontend logs
    print("\n--- pos_frontend logs (last 20 lines) ---")
    stdin, stdout, stderr = client.exec_command("docker logs pos_frontend 2>&1 | tail -20")
    print(stdout.read().decode())

    # 3. Test if Nginx inside pos_frontend is responding
    print("\n--- Curl test to pos_frontend internal IP ---")
    stdin, stdout, stderr = client.exec_command("docker inspect pos_frontend --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'")
    ip = stdout.read().decode().strip().split('\n')[0]
    print(f"pos_frontend IP: {ip}")
    stdin, stdout, stderr = client.exec_command(f"curl -s -o /dev/null -w '%{{http_code}}' http://{ip}:80 --max-time 5")
    print(f"HTTP status from container: {stdout.read().decode()}")

    # 4. Check if backend is actually running
    print("\n--- docker ps status ---")
    stdin, stdout, stderr = client.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}'")
    print(stdout.read().decode())

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
