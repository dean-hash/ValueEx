from __future__ import annotations

import json
import os
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List

import requests
from fastapi import APIRouter

from .suppression import add_suppression

ROOT = Path(__file__).resolve().parents[1]
DATA_INBOUND = ROOT / "data" / "inbound"
DATA_INBOUND.mkdir(parents=True, exist_ok=True)

SENDER_DOMAIN = (os.getenv("SENDER_DOMAIN") or "").strip().lower()
SNS_FEEDBACK_TOPIC_ARN = (os.getenv("SNS_FEEDBACK_TOPIC_ARN") or "").strip()
SNS_INBOUND_TOPIC_ARN = (os.getenv("SNS_INBOUND_TOPIC_ARN") or "").strip()

def _unsub_addr_env() -> str:
    ua = (os.getenv("UNSUBSCRIBE_ADDRESS") or "").strip().lower()
    if not ua and SENDER_DOMAIN:
        ua = f"unsubscribe@{SENDER_DOMAIN}"
    return ua

router = APIRouter()


def _save_event(prefix: str, payload: Dict[str, Any]) -> str:
    ts = int(time.time())
    mid = str(payload.get("MessageId") or uuid.uuid4())
    path = DATA_INBOUND / f"{ts}_{prefix}_{mid}.json"
    try:
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass
    return str(path)


def _maybe_confirm_subscription(payload: Dict[str, Any]) -> Dict[str, Any]:
    if (os.getenv("AUTO_CONFIRM_SNS") or "").strip() not in ("1", "true", "yes"):  # opt-in via env
        return {"confirmed": False, "reason": "AUTO_CONFIRM_SNS not enabled"}
    url = (payload.get("SubscribeURL") or "").strip()
    if not url:
        return {"confirmed": False, "reason": "SubscribeURL missing"}
    try:
        r = requests.get(url, timeout=10)
        return {"confirmed": r.status_code == 200, "status": r.status_code}
    except Exception as e:
        return {"confirmed": False, "error": str(e)[:200]}


def _topic_matches(payload: Dict[str, Any], expected_arn: str) -> bool:
    if not expected_arn:
        return True  # not enforced
    return (payload.get("TopicArn") or "").strip() == expected_arn


def _json_message(payload: Dict[str, Any]) -> Dict[str, Any]:
    msg = payload.get("Message")
    if isinstance(msg, dict):
        return msg
    if isinstance(msg, str):
        try:
            return json.loads(msg)
        except Exception:
            return {"raw": msg}
    return {}


def _emails_from_bounce(msg: Dict[str, Any]) -> List[str]:
    out: List[str] = []
    try:
        for br in (msg.get("bounce", {}).get("bouncedRecipients") or []):
            e = (br.get("emailAddress") or "").strip()
            if e:
                out.append(e)
    except Exception:
        pass
    return out


def _emails_from_complaint(msg: Dict[str, Any]) -> List[str]:
    out: List[str] = []
    try:
        for br in (msg.get("complaint", {}).get("complainedRecipients") or []):
            e = (br.get("emailAddress") or "").strip()
            if e:
                out.append(e)
    except Exception:
        pass
    return out


def _emails_from_inbound(msg: Dict[str, Any]) -> List[str]:
    # SES inbound (Receive) event
    out: List[str] = []
    mail = msg.get("mail") or {}
    src = (mail.get("source") or "").strip()
    if src:
        out.append(src)
    ch = (mail.get("commonHeaders") or {})
    for f in (ch.get("from") or []):
        if isinstance(f, str):
            # extract last angle-bracketed email if present
            if "<" in f and ">" in f:
                e = f.split("<")[-1].split(">")[0].strip()
            else:
                e = f.strip()
            if e:
                out.append(e)
    # Dedup
    uniq = []
    seen = set()
    for e in out:
        el = e.lower()
        if el not in seen:
            uniq.append(e)
            seen.add(el)
    return uniq


@router.post("/ses/feedback")
async def ses_feedback(payload: Dict[str, Any]) -> Dict[str, Any]:
    typ = (payload.get("Type") or "").strip()
    saved = _save_event("feedback", payload)
    out: Dict[str, Any] = {"saved": saved, "type": typ}

    # Enforce TopicArn if configured
    if not _topic_matches(payload, SNS_FEEDBACK_TOPIC_ARN):
        out["topic_ok"] = False
        out["error"] = "TopicArn mismatch"
        return out

    if typ == "SubscriptionConfirmation":
        out["subscription"] = _maybe_confirm_subscription(payload)
        return out

    if typ == "Notification":
        msg = _json_message(payload)
        ntype = (msg.get("notificationType") or "").lower()
        emails: List[str] = []
        reason = ""
        if ntype == "bounce":
            emails = _emails_from_bounce(msg)
            reason = "bounce"
        elif ntype == "complaint":
            emails = _emails_from_complaint(msg)
            reason = "complaint"
        if emails:
            for e in emails:
                try:
                    add_suppression(e, reason=reason, source="ses_feedback")
                except Exception:
                    pass
            out["suppressed"] = len(emails)
        out["notificationType"] = ntype
        return out

    return out


@router.post("/ses/inbound")
async def ses_inbound(payload: Dict[str, Any]) -> Dict[str, Any]:
    typ = (payload.get("Type") or "").strip()
    saved = _save_event("inbound", payload)
    out: Dict[str, Any] = {"saved": saved, "type": typ}

    # Enforce TopicArn if configured
    if not _topic_matches(payload, SNS_INBOUND_TOPIC_ARN):
        out["topic_ok"] = False
        out["error"] = "TopicArn mismatch"
        return out

    if typ == "SubscriptionConfirmation":
        out["subscription"] = _maybe_confirm_subscription(payload)
        return out

    if typ == "Notification":
        msg = _json_message(payload)
        # If inbound to unsubscribe@ address, suppress sender
        unsub_addr = _unsub_addr_env()
        dests = [d.lower() for d in ((msg.get("mail") or {}).get("destination") or []) if isinstance(d, str)]
        if unsub_addr and any(unsub_addr == d for d in dests):
            emails = _emails_from_inbound(msg)
            for e in emails:
                try:
                    add_suppression(e, reason="inbound_unsubscribe", source="ses_inbound")
                except Exception:
                    pass
            out["suppressed"] = len(emails)
        return out

    return out
