import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # Query database users' staff and active status
    run_cmd = (
        "cd /var/www/pos-system/enterprise-pos/backend && "
        "source venv/bin/activate && "
        "python manage.py shell -c \"from django.contrib.auth.models import User; print([(u.username, u.is_superuser, u.is_staff, u.is_active) for u in User.objects.all()])\" && "
        "deactivate"
    )
    stdin, stdout, stderr = client.exec_command(run_cmd)
    
    print("--- User Status ---")
    print(stdout.read().decode())
    print("Errors:")
    print(stderr.read().decode())
    
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
