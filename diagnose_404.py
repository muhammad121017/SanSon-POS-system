import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")

    # 1. Check if pos_frontend is on n8n_default network
    print("\n--- pos_frontend networks ---")
    stdin, stdout, stderr = client.exec_command("docker inspect pos_frontend --format '{{json .NetworkSettings.Networks}}' | python3 -c \"import sys,json; d=json.load(sys.stdin); [print(k) for k in d.keys()]\"")
    print(stdout.read().decode())

    # 2. Check Traefik labels on pos_frontend
    print("\n--- pos_frontend Traefik labels ---")
    stdin, stdout, stderr = client.exec_command("docker inspect pos_frontend --format '{{json .Config.Labels}}' | python3 -c \"import sys,json; d=json.load(sys.stdin); [print(k,'=',v) for k,v in d.items() if 'traefik' in k]\"")
    print(stdout.read().decode())

    # 3. Check Traefik logs for sansons
    print("\n--- Traefik logs (last 30 lines) ---")
    stdin, stdout, stderr = client.exec_command("docker logs n8n-traefik-1 2>&1 | tail -30")
    print(stdout.read().decode())

    # 4. DNS check - what IP does sansons.shop resolve to?
    print("\n--- DNS resolution for sansons.shop ---")
    stdin, stdout, stderr = client.exec_command("dig +short sansons.shop")
    print(stdout.read().decode())

    # 5. Check what IP the VPS has
    print("\n--- VPS Public IP ---")
    stdin, stdout, stderr = client.exec_command("curl -s ifconfig.me")
    print(stdout.read().decode())

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
