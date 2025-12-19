import smtplib
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

def test_smtp():
    user = os.getenv("SMTP_USER")
    pw = os.getenv("SMTP_PASS")
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "465"))

    print(f"Testing SMTP for {user} at {host}:{port}...")
    try:
        with smtplib.SMTP_SSL(host, port, timeout=10) as server:
            print("Connected. Logging in...")
            server.login(user, pw)
            print("Login successful!")
    except Exception as e:
        print(f"SMTP Test FAILED: {e}")

if __name__ == "__main__":
    test_smtp()
