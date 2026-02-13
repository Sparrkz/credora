import smtplib
from email.mime.text import MIMEText

def test_smtp():
    hosts = ["corion.cc", "server184.web-hosting.com"]
    port = 465
    user = "security@corion.cc"
    password = "D*sin2+j,{PU"
    
    for host in hosts:
        print(f"\n--- Testing Host: {host} ---")
        try:
            print(f"Connecting to {host}:{port}...")
            server = smtplib.SMTP_SSL(host, port, timeout=10)
            print("Connected. Logging in...")
            server.login(user, password)
            print("Login successful!")
            
            msg = MIMEText("Test message")
            msg['Subject'] = "SMTP Test"
            msg['From'] = user
            msg['To'] = user
            server.send_message(msg)
            print("Test email sent!")
            server.quit()
            return # Stop if one works
        except Exception as e:
            print(f"Error for {host}: {e}")

if __name__ == "__main__":
    test_smtp()
