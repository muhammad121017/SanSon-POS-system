import paramiko
import sys

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print("Connecting to VPS...")
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # 1. Reset user passwords
    reset_script = """
from django.contrib.auth.models import User
try:
    u = User.objects.get(username='muhammad')
    u.set_password('mady1122')
    u.is_superuser = True
    u.is_staff = True
    u.save()
    print("SUCCESS: muhammad password set to mady1122")
except User.DoesNotExist:
    User.objects.create_superuser('muhammad', 'muhammad@example.com', 'mady1122')
    print("SUCCESS: muhammad created with mady1122")

try:
    u2 = User.objects.get(username='admin')
    u2.set_password('admin1122')
    u2.is_superuser = True
    u2.is_staff = True
    u2.save()
    print("SUCCESS: admin password set to admin1122")
except User.DoesNotExist:
    User.objects.create_superuser('admin', 'admin@example.com', 'admin1122')
    print("SUCCESS: admin created with admin1122")
"""
    stdin, stdout, stderr = client.exec_command("cat > /var/www/pos-system/enterprise-pos/backend/temp_reset_all.py")
    stdin.write(reset_script)
    stdin.channel.shutdown_write()
    
    run_cmd = (
        "cd /var/www/pos-system/enterprise-pos/backend && "
        "source venv/bin/activate && "
        "python manage.py shell < temp_reset_all.py && "
        "rm -f temp_reset_all.py && "
        "deactivate"
    )
    stdin, stdout, stderr = client.exec_command(run_cmd)
    print("Script Execution Output:")
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    # 2. Verify with curl (muhammad)
    print("\n--- Verifying login for 'muhammad' ---")
    curl_muhammad = 'curl -X POST -H "Content-Type: application/json" -d \'{"username":"muhammad","password":"mady1122"}\' -i http://localhost:8080/api/auth/login/'
    stdin, stdout, stderr = client.exec_command(curl_muhammad)
    print(stdout.read().decode())
    
    # 3. Verify with curl (admin)
    print("\n--- Verifying login for 'admin' ---")
    curl_admin = 'curl -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin1122"}\' -i http://localhost:8080/api/auth/login/'
    stdin, stdout, stderr = client.exec_command(curl_admin)
    print(stdout.read().decode())
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
finally:
    client.close()
