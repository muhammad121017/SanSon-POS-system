import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # 1. Copy migration file from container to VPS host folder
    print("Copying migration file to VPS host repository...")
    cmd_cp = "docker cp pos_backend:/app/inventory/migrations/0005_customer_discount_purchaseorder_supplier_and_more.py /docker/sansonspos/enterprise-pos/backend/inventory/migrations/"
    stdin, stdout, stderr = client.exec_command(cmd_cp)
    print(stderr.read().decode())
    
    # 2. Add, commit and push from VPS host directly to GitHub
    print("Staging and pushing migration file to GitHub...")
    cmd_git = "cd /docker/sansonspos && git add enterprise-pos/backend/inventory/migrations/0005_customer_discount_purchaseorder_supplier_and_more.py && git commit -m 'Add database v2.0 migration files generated on deployment' && git push origin main"
    stdin, stdout, stderr = client.exec_command(cmd_git)
    print("STDOUT:")
    print(stdout.read().decode())
    print("STDERR:")
    print(stderr.read().decode())

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
