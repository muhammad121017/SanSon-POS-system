import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # Query database users
    cmd = 'mysql -u pos_user -p"Mady7077**" pos_db -e "SELECT id, username, email, is_superuser, is_active FROM auth_user;"'
    stdin, stdout, stderr = client.exec_command(cmd)
    
    print("--- Users in Database ---")
    print(stdout.read().decode())
    
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
