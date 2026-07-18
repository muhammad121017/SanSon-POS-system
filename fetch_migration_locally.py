import paramiko

hostname = "72.61.151.29"
username = "root"
password = "Stayaway008@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected.")
    
    # Read migration file content
    filepath = "/docker/sansonspos/enterprise-pos/backend/inventory/migrations/0005_customer_discount_purchaseorder_supplier_and_more.py"
    stdin, stdout, stderr = client.exec_command(f"cat {filepath}")
    content = stdout.read().decode()
    
    # Save locally
    local_path = r"c:\Users\Rizwan computers\Desktop\Main\POS\enterprise-pos\backend\inventory\migrations\0005_customer_discount_purchaseorder_supplier_and_more.py"
    with open(local_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Successfully copied migration file to local repository: {local_path}")

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
