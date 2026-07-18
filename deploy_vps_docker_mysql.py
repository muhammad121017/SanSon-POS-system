import paramiko
import sys

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to VPS {hostname}...")
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # 1. Update MySQL config on host to listen on 0.0.0.0 (all interfaces)
    print("\n--- Configuring host MySQL to listen on all interfaces ---")
    update_mysql_bind = "sed -i 's/bind-address\\s*=\\s*127.0.0.1/bind-address = 0.0.0.0/g' /etc/mysql/mysql.conf.d/mysqld.cnf"
    stdin, stdout, stderr = client.exec_command(update_mysql_bind)
    if stdout.channel.recv_exit_status() != 0:
        print("Failed to modify MySQL bind-address configuration")
        sys.exit(1)
        
    client.exec_command("systemctl restart mysql")
    print("MySQL service restarted.")
    
    # 2. Grant MySQL remote permissions for pos_user from any container IP (%)
    print("\n--- Granting remote MySQL access to pos_user ---")
    grant_cmd = 'mysql -u root -p"Stayaway008@" -e "CREATE USER IF NOT EXISTS \'pos_user\'@\'%\' IDENTIFIED BY \'Mady7077**\'; GRANT ALL PRIVILEGES ON pos_db.* TO \'pos_user\'@\'%\'; FLUSH PRIVILEGES;"'
    stdin, stdout, stderr = client.exec_command(grant_cmd)
    
    # We read output to see if it failed
    err = stderr.read().decode()
    if err and "Warning" not in err:
        print(f"MySQL Grant Error: {err}")
    else:
        print("MySQL permissions successfully granted!")
        
    # 3. Pull latest repository to VPS
    print("\n--- Synchronizing project codebase on VPS ---")
    # Check if /docker/sansonspos is a git repo
    stdin, stdout, stderr = client.exec_command("cd /docker/sansonspos && git status")
    is_git = stdout.channel.recv_exit_status() == 0
    
    if is_git:
        print("Repository folder exists. Pulling latest commits...")
        stdin, stdout, stderr = client.exec_command("cd /docker/sansonspos && git reset --hard && git clean -fd && git pull")
        print(stdout.read().decode())
        print(stderr.read().decode())
    else:
        print("Re-creating project repository directory...")
        client.exec_command("rm -rf /docker/sansonspos")
        stdin, stdout, stderr = client.exec_command("git clone https://github.com/muhammad121017/SanSon-POS-system.git /docker/sansonspos")
        print(stdout.read().decode())
        print(stderr.read().decode())
        
    # 4. Write custom docker-compose.yml to /docker/sansonspos/docker-compose.yml
    print("\n--- Writing production docker-compose.yml ---")
    docker_compose_content = """version: '3.8'

services:
  backend:
    build:
      context: ./enterprise-pos/backend
      dockerfile: Dockerfile
    container_name: sansons_backend
    restart: always
    environment:
      - DB_NAME=pos_db
      - DB_USER=pos_user
      - DB_PASSWORD=Mady7077**
      - DB_HOST=172.18.0.1
      - DB_PORT=3306
      - SECRET_KEY=django-insecure-j2-vps-deploy-muhammad-2026
      - DEBUG=False
      - ALLOWED_HOSTS=*
      - CORS_ALLOW_ALL_ORIGINS=True
    volumes:
      - django_static:/app/staticfiles
    networks:
      - n8n_default

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sansons_frontend
    restart: always
    labels:
      - traefik.enable=true
      - traefik.http.routers.sansons.rule=Host(`sansons.shop`,`www.sansons.shop`)
      - traefik.http.routers.sansons.entrypoints=websecure
      - traefik.http.routers.sansons.tls=true
      - traefik.http.routers.sansons.tls.certresolver=mytlschallenge
      - traefik.http.services.sansons.loadbalancer.server.port=80
    depends_on:
      - backend
    volumes:
      - django_static:/usr/share/nginx/html/static
    networks:
      - n8n_default

volumes:
  django_static:

networks:
  n8n_default:
    external: true
"""
    # Write to remote file
    stdin, stdout, stderr = client.exec_command("cat > /docker/sansonspos/docker-compose.yml")
    stdin.write(docker_compose_content)
    stdin.channel.shutdown_write()
    if stdout.channel.recv_exit_status() != 0:
         print("Failed to write docker-compose.yml on VPS")
         sys.exit(1)
         
    # 5. Build and launch containers
    print("\n--- Building and launching Docker Compose services ---")
    build_and_up = "cd /docker/sansonspos && docker compose down && docker compose up --build -d"
    stdin, stdout, stderr = client.exec_command(build_and_up)
    
    # Read output and stderr (avoid blocking, wait for completion)
    exit_status = stdout.channel.recv_exit_status()
    print("Build stdout:")
    print(stdout.read().decode())
    print("Build stderr:")
    print(stderr.read().decode())
    
    if exit_status == 0:
        print("\n[SUCCESS] Deployed successfully! Traefik is now routing sansons.shop to your POS system using Host MySQL.")
    else:
        print("\n[FAILED] Docker Compose failed to spin up containers.")
        sys.exit(1)

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
finally:
    client.close()
