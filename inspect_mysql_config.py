import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # 1. Check bind-address in MySQL config
    stdin, stdout, stderr = client.exec_command("grep -rn 'bind-address' /etc/mysql/")
    print("--- MySQL Bind Settings ---")
    print(stdout.read().decode())
    
    # 2. Check MySQL users in database
    mysql_cmd = 'mysql -u root -p"Stayaway008@" -e "SELECT user, host FROM mysql.user;"'
    stdin, stdout, stderr = client.exec_command(mysql_cmd)
    print("--- MySQL Users ---")
    print(stdout.read().decode())
    print(stderr.read().decode())
    
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
