import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

from datetime import datetime
from pathlib import Path

load_dotenv()

LOG_FILE = Path(__file__).resolve().parent.parent / "email_debug.log"

def log_to_file(msg: str):
    """Logs a message to a local file for debugging."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {msg}\n")

def send_admin_reply_email(to_email: str, original_message: str, admin_reply: str):
    """
    Sends an email to the user when an admin replies to their feedback.
    """
    log_to_file(f"Starting email send to: {to_email}")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))

    if not smtp_user or not smtp_pass:
        log_to_file("ERROR: SMTP credentials not found in environment variables.")
        return False

    msg = MIMEMultipart()
    msg['From'] = f"Opradox Support <{smtp_user}>"
    msg['To'] = to_email
    msg['Subject'] = "Opradox - Mesajınız Yanıtlandı"

    body = f"""
Merhaba,

Opradox üzerinden gönderdiğiniz mesajınız yanıtlandı.

GÖNDERDİĞİNİZ MESAJ:
-------------------------------------------
{original_message}
-------------------------------------------

OPRADOX EKİBİNİN YANITI:
-------------------------------------------
{admin_reply}
-------------------------------------------

Teşekkürler,
Opradox Ekibi
www.opradox.com
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        log_to_file(f"Connecting to {smtp_host}:{smtp_port} (SSL)...")
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as server:
            log_to_file("Logging in...")
            server.login(smtp_user, smtp_pass)
            log_to_file("Sending message...")
            server.send_message(msg)
        log_to_file(f"SUCCESS: Email sent successfully to {to_email}")
        return True
    except Exception as e:
        log_to_file(f"FAILED: Error sending email: {str(e)}")
        return False
