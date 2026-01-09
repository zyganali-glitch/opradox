"""
Telegram Notifier - Opradox Monitoring
FAZ-ES-7: Central Telegram notification module.
Uses only stdlib (urllib.request) for minimal dependencies.
"""
from __future__ import annotations
import os
import json
import urllib.request
import urllib.parse
import urllib.error
from typing import Optional, List

# ============================================================
# AUTO-LOAD .env FILE
# ============================================================

def _load_dotenv():
    """Load .env file from project root (simple loader, no dependencies)."""
    import pathlib
    
    # Try multiple locations
    possible_paths = [
        pathlib.Path(__file__).parent.parent / ".env",  # opradox/.env
        pathlib.Path(__file__).parent / ".env",          # monitoring/.env
        pathlib.Path.cwd() / ".env",                     # current dir
    ]
    
    for env_path in possible_paths:
        if env_path.exists():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            key, _, value = line.partition("=")
                            key = key.strip()
                            value = value.strip().strip('"').strip("'")
                            if key and key not in os.environ:
                                os.environ[key] = value
                print(f"[ENV] Loaded from {env_path}")
                return True
            except Exception as e:
                print(f"[ENV] Error loading {env_path}: {e}")
    return False

# Auto-load on import
_load_dotenv()

# ============================================================
# CONFIGURATION (from environment)
# ============================================================

def _get_bot_token() -> Optional[str]:
    """Get Telegram bot token from environment."""
    return os.environ.get("TG_BOT_TOKEN")


def _get_chat_ids() -> List[str]:
    """Get chat IDs from environment (comma-separated)."""
    raw = os.environ.get("TG_CHAT_ID", "")
    if not raw:
        return []
    return [cid.strip() for cid in raw.split(",") if cid.strip()]


# ============================================================
# MESSAGE TEMPLATES
# ============================================================

TEMPLATES = {
    "tr": {
        "fail": "🚨 ALARM: {service} sağlık kontrolü FAIL.\nSebep: {reason}\nSon başarılı: {last_ok_ts}",
        "degraded": "⚠️ UYARI: {service} kısmi sorun (DEGRADED).\nDetay: {reason}\nSon başarılı: {last_ok_ts}",
        "recover": "✅ DÜZELDİ: {service} tekrar OK.\nKesinti süresi: {downtime}\nŞu an: {now_ts}",
    },
    "en": {
        "fail": "🚨 ALERT: {service} healthcheck FAIL.\nReason: {reason}\nLast OK: {last_ok_ts}",
        "degraded": "⚠️ WARNING: {service} is DEGRADED.\nDetails: {reason}\nLast OK: {last_ok_ts}",
        "recover": "✅ RECOVERED: {service} back to OK.\nDowntime: {downtime}\nNow: {now_ts}",
    }
}


def format_message(
    msg_type: str,
    service: str,
    reason: str = "",
    last_ok_ts: str = "N/A",
    downtime: str = "",
    now_ts: str = "",
    lang: str = "tr"
) -> str:
    """Format a message from template."""
    templates = TEMPLATES.get(lang, TEMPLATES["en"])
    template = templates.get(msg_type, "{service}: {reason}")
    
    return template.format(
        service=service,
        reason=reason or "N/A",
        last_ok_ts=last_ok_ts,
        downtime=downtime,
        now_ts=now_ts
    )


# ============================================================
# TELEGRAM API
# ============================================================

def send_message(
    text: str,
    parse_mode: Optional[str] = None,
    disable_notification: bool = False
) -> dict:
    """
    Send message to all configured chat IDs.
    
    Args:
        text: Message text
        parse_mode: Optional, "HTML" or "Markdown"
        disable_notification: If True, send silently
    
    Returns:
        dict with "ok" and "results" or "error"
    """
    bot_token = _get_bot_token()
    chat_ids = _get_chat_ids()
    
    if not bot_token:
        return {"ok": False, "error": "TG_BOT_TOKEN not set"}
    
    if not chat_ids:
        return {"ok": False, "error": "TG_CHAT_ID not set"}
    
    results = []
    
    for chat_id in chat_ids:
        try:
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            
            data = {
                "chat_id": chat_id,
                "text": text,
                "disable_notification": disable_notification
            }
            
            if parse_mode:
                data["parse_mode"] = parse_mode
            
            # Encode data
            encoded_data = urllib.parse.urlencode(data).encode("utf-8")
            
            # Make request
            req = urllib.request.Request(url, data=encoded_data, method="POST")
            req.add_header("Content-Type", "application/x-www-form-urlencoded")
            
            with urllib.request.urlopen(req, timeout=10) as resp:
                response_data = json.loads(resp.read().decode("utf-8"))
                results.append({
                    "chat_id": chat_id,
                    "ok": response_data.get("ok", False),
                    "message_id": response_data.get("result", {}).get("message_id")
                })
                
        except urllib.error.HTTPError as e:
            results.append({
                "chat_id": chat_id,
                "ok": False,
                "error": f"HTTP {e.code}: {e.reason}"
            })
        except urllib.error.URLError as e:
            results.append({
                "chat_id": chat_id,
                "ok": False,
                "error": f"URL Error: {str(e.reason)}"
            })
        except Exception as e:
            results.append({
                "chat_id": chat_id,
                "ok": False,
                "error": str(e)
            })
    
    # Overall success if at least one succeeded
    any_ok = any(r.get("ok") for r in results)
    
    return {
        "ok": any_ok,
        "results": results
    }


def send_alert(
    msg_type: str,
    service: str,
    reason: str = "",
    last_ok_ts: str = "N/A",
    downtime: str = "",
    now_ts: str = "",
    lang: str = "tr"
) -> dict:
    """
    High-level function to send formatted alert.
    
    Args:
        msg_type: "fail", "degraded", or "recover"
        service: Service name
        reason: Failure/degraded reason
        last_ok_ts: Last OK timestamp
        downtime: Downtime duration (for recover)
        now_ts: Current timestamp (for recover)
        lang: Language ("tr" or "en")
    
    Returns:
        Result dict from send_message
    """
    text = format_message(
        msg_type=msg_type,
        service=service,
        reason=reason,
        last_ok_ts=last_ok_ts,
        downtime=downtime,
        now_ts=now_ts,
        lang=lang
    )
    
    return send_message(text)


# ============================================================
# CLI TEST
# ============================================================

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python telegram_notifier.py <message>")
        print("       python telegram_notifier.py --test")
        sys.exit(1)
    
    if sys.argv[1] == "--test":
        result = send_message("🔧 Opradox Monitoring Test Message")
        print(json.dumps(result, indent=2))
    else:
        message = " ".join(sys.argv[1:])
        result = send_message(message)
        print(json.dumps(result, indent=2))
