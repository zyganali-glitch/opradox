from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "feedback.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_feedback_db() -> None:
    """
    feedback.db içinde feedback tablosunu oluşturur (yoksa).
    Mevcut tabloya rating kolonu ekler (migration).
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            name TEXT,
            email TEXT,
            message_type TEXT NOT NULL,
            message TEXT NOT NULL,
            scenario_id TEXT,
            status TEXT NOT NULL,
            liked INTEGER NOT NULL DEFAULT 0,
            admin_reply TEXT,
            admin_replied_at TEXT,
            rating INTEGER DEFAULT NULL
        )
        """
    )
    
    # Migration: rating kolonu yoksa ekle
    try:
        cur.execute("ALTER TABLE feedback ADD COLUMN rating INTEGER DEFAULT NULL")
    except sqlite3.OperationalError:
        pass  # Kolon zaten var
    
    conn.commit()
    conn.close()


def insert_feedback(
    *,
    name: Optional[str],
    email: Optional[str],
    message_type: str,
    message: str,
    scenario_id: Optional[str],
    rating: Optional[int] = None,
) -> int:
    now = datetime.utcnow().isoformat()
    status = "visible"
    liked = 0

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO feedback (
            created_at, name, email, message_type,
            message, scenario_id, status, liked, rating
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (now, name, email, message_type, message, scenario_id, status, liked, rating),
    )
    feedback_id = cur.lastrowid
    conn.commit()
    conn.close()
    return int(feedback_id)


def list_feedback(
    *,
    status: Optional[str] = None,
    message_type: Optional[str] = None,
    scenario_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    query = "SELECT * FROM feedback WHERE 1=1"
    params: List[Any] = []

    if status:
        query += " AND status = ?"
        params.append(status)

    if message_type:
        query += " AND message_type = ?"
        params.append(message_type)

    if scenario_id:
        query += " AND scenario_id = ?"
        params.append(scenario_id)

    query += " ORDER BY datetime(created_at) DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def update_feedback(
    feedback_id: int,
    *,
    status: Optional[str] = None,
    liked: Optional[bool] = None,
    admin_reply: Optional[str] = None,
) -> bool:
    fields = []
    params: List[Any] = []

    if status is not None:
        fields.append("status = ?")
        params.append(status)

    if liked is not None:
        fields.append("liked = ?")
        params.append(1 if liked else 0)

    if admin_reply is not None:
        fields.append("admin_reply = ?")
        params.append(admin_reply)
        fields.append("admin_replied_at = ?")
        params.append(datetime.utcnow().isoformat())

    if not fields:
        return False

    params.append(feedback_id)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        f"UPDATE feedback SET {', '.join(fields)} WHERE id = ?",
        params,
    )
    conn.commit()
    changed = cur.rowcount > 0
    conn.close()
    return changed


def delete_feedback(feedback_id: int) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM feedback WHERE id = ?", (feedback_id,))
    conn.commit()
    changed = cur.rowcount > 0
    conn.close()
    return changed


def get_feedback_stats() -> Dict[str, Any]:
    """
    Admin dashboard için istatistikler döndürür.
    """
    conn = get_connection()
    cur = conn.cursor()
    
    # Toplam sayılar
    cur.execute("SELECT COUNT(*) as total FROM feedback")
    total = cur.fetchone()["total"]
    
    cur.execute("SELECT COUNT(*) as today FROM feedback WHERE date(created_at) = date('now')")
    today = cur.fetchone()["today"]
    
    cur.execute("SELECT COUNT(*) as this_week FROM feedback WHERE created_at >= datetime('now', '-7 days')")
    this_week = cur.fetchone()["this_week"]
    
    cur.execute("SELECT COUNT(*) as unanswered FROM feedback WHERE admin_reply IS NULL AND status = 'visible'")
    unanswered = cur.fetchone()["unanswered"]
    
    # Mesaj türü dağılımı
    cur.execute("""
        SELECT message_type, COUNT(*) as count 
        FROM feedback 
        GROUP BY message_type
    """)
    type_distribution = {row["message_type"]: row["count"] for row in cur.fetchall()}
    
    # En çok mesaj alan senaryolar (Top 5)
    cur.execute("""
        SELECT scenario_id, COUNT(*) as count 
        FROM feedback 
        WHERE scenario_id IS NOT NULL 
        GROUP BY scenario_id 
        ORDER BY count DESC 
        LIMIT 5
    """)
    top_scenarios = [{"scenario_id": row["scenario_id"], "count": row["count"]} for row in cur.fetchall()]
    
    # Ortalama rating
    cur.execute("SELECT AVG(rating) as avg_rating FROM feedback WHERE rating IS NOT NULL")
    avg_rating_row = cur.fetchone()
    avg_rating = round(avg_rating_row["avg_rating"], 1) if avg_rating_row["avg_rating"] else None
    
    # Rating dağılımı
    cur.execute("""
        SELECT rating, COUNT(*) as count 
        FROM feedback 
        WHERE rating IS NOT NULL 
        GROUP BY rating
    """)
    rating_distribution = {row["rating"]: row["count"] for row in cur.fetchall()}
    
    conn.close()
    
    return {
        "total": total,
        "today": today,
        "this_week": this_week,
        "unanswered": unanswered,
        "type_distribution": type_distribution,
        "top_scenarios": top_scenarios,
        "avg_rating": avg_rating,
        "rating_distribution": rating_distribution,
    }
