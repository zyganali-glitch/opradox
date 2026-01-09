"""
Health Pinger - Opradox Monitoring
FAZ-ES-7: Central health check script for all services.
Uses only stdlib for minimal dependencies.
"""
from __future__ import annotations
import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple

# Import telegram notifier
from telegram_notifier import send_alert, send_message

# ============================================================
# CONSTANTS
# ============================================================

STATUS_OK = "OK"
STATUS_DEGRADED = "DEGRADED"
STATUS_FAIL = "FAIL"
STATUS_SKIP = "SKIP"

STATE_FILE_NAME = "monitor_state.json"

# ============================================================
# STATE MANAGEMENT
# ============================================================

def load_state(state_path: Path) -> Dict[str, Any]:
    """Load monitor state from JSON file."""
    if not state_path.exists():
        return {}
    try:
        with open(state_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_state(state_path: Path, state: Dict[str, Any]) -> None:
    """Save monitor state to JSON file."""
    try:
        with open(state_path, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[ERROR] Could not save state: {e}")


def get_service_state(state: Dict[str, Any], service_id: str) -> Dict[str, Any]:
    """Get or create state for a service."""
    if service_id not in state:
        state[service_id] = {
            "last_status": STATUS_OK,
            "last_ok_ts": None,
            "last_alert_ts": None,
            "consecutive_fail": 0,
            "consecutive_ok": 0,
            "last_reason": None
        }
    return state[service_id]


# ============================================================
# HTTP HELPERS
# ============================================================

def http_get(url: str, timeout: int = 5, headers: Optional[Dict[str, str]] = None) -> Tuple[int, Optional[str], Optional[str]]:
    """
    Make HTTP GET request.
    Returns (status_code, response_body, error_message)
    """
    try:
        req = urllib.request.Request(url)
        if headers:
            for k, v in headers.items():
                # Resolve env vars
                if v.startswith("${ENV:") and v.endswith("}"):
                    env_key = v[6:-1]
                    v = os.environ.get(env_key, "")
                req.add_header(k, v)
        
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, body, None
            
    except urllib.error.HTTPError as e:
        return e.code, None, f"HTTP {e.code}"
    except urllib.error.URLError as e:
        return 0, None, f"Connection error: {str(e.reason)[:50]}"
    except Exception as e:
        return 0, None, str(e)[:50]


def get_nested_value(data: Dict[str, Any], path: str) -> Any:
    """Get nested value from dict using dot notation (e.g., 'storage.ok')."""
    keys = path.split(".")
    current = data
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
        if current is None:
            return None
    return current


# ============================================================
# SERVICE CHECKS
# ============================================================

def check_json_health(
    service: Dict[str, Any],
    config: Dict[str, Any]
) -> Tuple[str, str]:
    """
    Check service using JSON health endpoint.
    Returns (status, reason)
    """
    base_url = service.get("base_url", "")
    health_url = service.get("health_url", "/health")
    url = f"{base_url}{health_url}"
    timeout = config.get("timeout_seconds", 5)
    
    status_code, body, error = http_get(url, timeout)
    
    # Connection/HTTP error -> FAIL
    if error:
        return STATUS_FAIL, error
    
    expect = service.get("expect", {})
    expected_http = expect.get("http", 200)
    
    if status_code != expected_http:
        return STATUS_FAIL, f"HTTP {status_code} (expected {expected_http})"
    
    # Parse JSON
    try:
        data = json.loads(body)
    except Exception:
        return STATUS_FAIL, "Invalid JSON response"
    
    # Check required keys
    json_keys = expect.get("json_keys", [])
    for key in json_keys:
        if get_nested_value(data, key) is None:
            return STATUS_FAIL, f"Missing key: {key}"
    
    # Check status field
    status_field = data.get("status", data.get("ok"))
    if status_field in (False, "error", "fail"):
        return STATUS_FAIL, "status=fail in response"
    
    # Check degraded rules
    degraded_rules = service.get("degraded_rules", [])
    lang = config.get("language", "tr")
    
    for rule in degraded_rules:
        path = rule.get("path", "")
        expected_value = rule.get("equals")
        actual_value = get_nested_value(data, path)
        
        if actual_value == expected_value:
            reason_key = f"reason_{lang}"
            reason = rule.get(reason_key, rule.get("reason_en", f"{path}={actual_value}"))
            return STATUS_DEGRADED, reason
    
    return STATUS_OK, ""


def check_http_endpoints(
    service: Dict[str, Any],
    config: Dict[str, Any]
) -> Tuple[str, str]:
    """
    Check service using multiple HTTP endpoint checks.
    Returns (status, reason)
    """
    base_url = service.get("base_url", "")
    checks = service.get("checks", [])
    timeout = config.get("timeout_seconds", 5)
    skip_if_unreachable = service.get("skip_if_unreachable", False)
    
    failed_checks = []
    any_success = False
    all_optional_or_success = True
    
    for check in checks:
        url = f"{base_url}{check.get('url', '')}"
        expected_http = check.get("expect_http", 200)
        optional = check.get("optional", False)
        
        status_code, body, error = http_get(url, timeout)
        
        if error or status_code != expected_http:
            if not optional:
                failed_checks.append(check.get("url", url))
                all_optional_or_success = False
        else:
            any_success = True
    
    # If skip_if_unreachable and no success at all -> SKIP
    if skip_if_unreachable and not any_success:
        return STATUS_SKIP, "Service unreachable (skipped)"
    
    # If any required check failed -> FAIL
    if failed_checks:
        return STATUS_FAIL, f"Failed: {', '.join(failed_checks)}"
    
    return STATUS_OK, ""


def check_service(
    service: Dict[str, Any],
    config: Dict[str, Any]
) -> Tuple[str, str]:
    """
    Check a service based on its mode.
    Returns (status, reason)
    """
    mode = service.get("mode", "http_checks")
    
    if mode == "json_health":
        return check_json_health(service, config)
    else:
        return check_http_endpoints(service, config)


# ============================================================
# ALERT LOGIC
# ============================================================

def format_duration(seconds: float) -> str:
    """Format duration in human-readable form."""
    if seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        mins = int(seconds / 60)
        secs = int(seconds % 60)
        return f"{mins}m {secs}s"
    else:
        hours = int(seconds / 3600)
        mins = int((seconds % 3600) / 60)
        return f"{hours}h {mins}m"


def format_timestamp(ts: Optional[float]) -> str:
    """Format timestamp for display."""
    if ts is None:
        return "N/A"
    try:
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        return dt.strftime("%Y-%m-%d %H:%M:%S UTC")
    except Exception:
        return "N/A"


def should_send_alert(
    service_state: Dict[str, Any],
    new_status: str,
    config: Dict[str, Any]
) -> Tuple[bool, str]:
    """
    Determine if an alert should be sent based on thresholds and cooldowns.
    Returns (should_send, alert_type: "fail"|"degraded"|"recover"|"")
    """
    old_status = service_state.get("last_status", STATUS_OK)
    consecutive_fail = service_state.get("consecutive_fail", 0)
    consecutive_ok = service_state.get("consecutive_ok", 0)
    last_alert_ts = service_state.get("last_alert_ts")
    
    fail_threshold = config.get("fail_threshold", 2)
    ok_threshold = config.get("ok_threshold", 2)
    cooldown_fail = config.get("cooldown_fail_seconds", 600)
    cooldown_degraded = config.get("cooldown_degraded_seconds", 1800)
    
    now = time.time()
    
    # SKIP status -> no alert
    if new_status == STATUS_SKIP:
        return False, ""
    
    # Transition to OK after FAIL/DEGRADED -> potential RECOVER
    if new_status == STATUS_OK and old_status in (STATUS_FAIL, STATUS_DEGRADED):
        # Need consecutive OKs to confirm recovery
        if consecutive_ok + 1 >= ok_threshold:
            return True, "recover"
        return False, ""
    
    # Transition to FAIL
    if new_status == STATUS_FAIL:
        if consecutive_fail + 1 >= fail_threshold:
            # Check cooldown
            if last_alert_ts and (now - last_alert_ts) < cooldown_fail:
                return False, ""  # Still in cooldown
            return True, "fail"
        return False, ""
    
    # Transition to DEGRADED
    if new_status == STATUS_DEGRADED:
        if consecutive_fail + 1 >= fail_threshold:
            # Check cooldown
            if last_alert_ts and (now - last_alert_ts) < cooldown_degraded:
                return False, ""  # Still in cooldown
            return True, "degraded"
        return False, ""
    
    return False, ""


def update_service_state(
    service_state: Dict[str, Any],
    new_status: str,
    reason: str,
    alert_sent: bool
) -> None:
    """Update service state after a check."""
    now = time.time()
    old_status = service_state.get("last_status", STATUS_OK)
    
    # Update consecutive counters
    if new_status == STATUS_OK:
        service_state["consecutive_ok"] = service_state.get("consecutive_ok", 0) + 1
        service_state["consecutive_fail"] = 0
        service_state["last_ok_ts"] = now
    elif new_status in (STATUS_FAIL, STATUS_DEGRADED):
        service_state["consecutive_fail"] = service_state.get("consecutive_fail", 0) + 1
        service_state["consecutive_ok"] = 0
    # SKIP doesn't change counters
    
    if new_status != STATUS_SKIP:
        service_state["last_status"] = new_status
        service_state["last_reason"] = reason
    
    if alert_sent:
        service_state["last_alert_ts"] = now


# ============================================================
# MAIN LOOP
# ============================================================

def run_check_cycle(
    config: Dict[str, Any],
    state: Dict[str, Any],
    dry_run: bool = False
) -> None:
    """Run one check cycle for all services."""
    services = config.get("services", [])
    lang = config.get("language", "tr")
    
    for service in services:
        service_id = service.get("id", service.get("name", "unknown"))
        service_name = service.get("name", service_id)
        
        print(f"[CHECK] {service_name}...", end=" ")
        
        # Run check
        status, reason = check_service(service, config)
        print(f"{status}" + (f" ({reason})" if reason else ""))
        
        # Get/create state
        service_state = get_service_state(state, service_id)
        
        # Determine if alert needed
        should_alert, alert_type = should_send_alert(service_state, status, config)
        
        if should_alert:
            last_ok_ts = format_timestamp(service_state.get("last_ok_ts"))
            now_ts = format_timestamp(time.time())
            
            if alert_type == "recover":
                last_fail_ts = service_state.get("last_alert_ts") or service_state.get("last_ok_ts") or time.time()
                downtime = format_duration(time.time() - last_fail_ts)
                
                print(f"  -> SENDING RECOVER ALERT")
                if not dry_run:
                    send_alert("recover", service_name, "", last_ok_ts, downtime, now_ts, lang)
            else:
                print(f"  -> SENDING {alert_type.upper()} ALERT: {reason}")
                if not dry_run:
                    send_alert(alert_type, service_name, reason, last_ok_ts, "", now_ts, lang)
        
        # Update state
        update_service_state(service_state, status, reason, should_alert)


def main():
    parser = argparse.ArgumentParser(description="Opradox Health Pinger")
    parser.add_argument("--config", required=True, help="Path to config JSON file")
    parser.add_argument("--dry-run", action="store_true", help="Don't send Telegram messages")
    parser.add_argument("--once", action="store_true", help="Run once and exit (no loop)")
    args = parser.parse_args()
    
    # Load config
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"[ERROR] Config file not found: {config_path}")
        sys.exit(1)
    
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    
    # State file path (same directory as config)
    state_path = config_path.parent / STATE_FILE_NAME
    
    # Load state
    state = load_state(state_path)
    
    interval = config.get("interval_seconds", 60)
    
    print(f"[START] Opradox Health Pinger")
    print(f"  Config: {config_path}")
    print(f"  Interval: {interval}s")
    print(f"  Dry-run: {args.dry_run}")
    print(f"  Services: {len(config.get('services', []))}")
    print()
    
    try:
        while True:
            cycle_start = time.time()
            print(f"[CYCLE] {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
            
            run_check_cycle(config, state, dry_run=args.dry_run)
            
            # Save state
            save_state(state_path, state)
            
            if args.once:
                print("[DONE] Single run complete.")
                break
            
            # Sleep until next interval
            elapsed = time.time() - cycle_start
            sleep_time = max(0, interval - elapsed)
            print(f"[SLEEP] {sleep_time:.1f}s until next cycle\n")
            time.sleep(sleep_time)
            
    except KeyboardInterrupt:
        print("\n[STOP] Interrupted by user")
        save_state(state_path, state)
        sys.exit(0)


if __name__ == "__main__":
    main()
