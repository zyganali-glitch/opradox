import sqlite3
from pathlib import Path

DB_PATH = Path("backend/data/feedback.db")

def check_db():
    if not DB_PATH.exists():
        print("DB not found")
        return
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, message_type, message FROM feedback ORDER BY id DESC LIMIT 5")
    rows = cur.fetchall()
    for r in rows:
        print(f"ID: {r['id']}, Name: {r['name']}, Email: {r['email']}, Type: {r['message_type']}")
        print(f"Msg: {r['message'][:50]}...")
        print("-" * 20)
    conn.close()

if __name__ == "__main__":
    check_db()
