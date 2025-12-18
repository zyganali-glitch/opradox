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
            admin_replied_at TEXT
        )
        """
    )
    conn.commit()
    conn.close()


def insert_feedback(
    *,
    name: Optional[str],
    email: Optional[str],
    message_type: str,
    message: str,
    scenario_id: Optional[str],
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
            message, scenario_id, status, liked
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (now, name, email, message_type, message, scenario_id, status, liked),
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
