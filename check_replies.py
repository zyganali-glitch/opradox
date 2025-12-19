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
    cur.execute("SELECT id, name, admin_reply FROM feedback WHERE admin_reply IS NOT NULL")
    rows = cur.fetchall()
    print(f"Total with reply: {len(rows)}")
    for r in rows:
        print(f"ID: {r['id']}, Name: {r['name']}, Reply: {r['admin_reply']}")
    conn.close()

if __name__ == "__main__":
    check_db()
