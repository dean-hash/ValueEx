from __future__ import annotations

import os
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formatdate, make_msgid
from pathlib import Path
from typing import Dict

# Local imports
from app.suppression import is_suppressed

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OUTBOX_DIR = DATA_DIR / "outbox"
OUTBOX_DIR.mkdir(parents=True, exist_ok=True)


def _env(name: str, default: str = "") -> str:
    return (os.getenv(name) or default).strip()


def _from_addr() -> str:
    return _env("SMTP_FROM") or f"no-reply@{_env('SENDER_DOMAIN') or 'localhost'}"


def _unsubscribe_mailto() -> str:
    ua = _env("UNSUBSCRIBE_ADDRESS")
    if ua:
        return ua
    dom = _env("SENDER_DOMAIN")
    return f"unsubscribe@{dom}" if dom else ""


def compose_message(to_email: str, subject: str, html_body: str, text_body: str | None = None) -> EmailMessage:
    msg = EmailMessage()
    from_name = _env("SMTP_NAME")
    from_addr = _from_addr()
    msg["From"] = f"{from_name} <{from_addr}>" if from_name else from_addr
    msg["To"] = to_email
    msg["Subject"] = subject
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain=(from_addr.split("@",1)[-1] if "@" in from_addr else None))

    # List-Unsubscribe headers
    lus: list[str] = []
    mailto = _unsubscribe_mailto()
    if mailto:
        lus.append(f"<mailto:{mailto}>")
    url = _env("UNSUBSCRIBE_URL")
    if url:
        lus.append(f"<{url}>")
    if lus:
        msg["List-Unsubscribe"] = ", ".join(lus)
        msg["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"

    # Content
    if text_body:
        msg.set_content(text_body)
        msg.add_alternative(html_body, subtype="html")
    else:
        # Derive simple plaintext fallback
        import re
        text = re.sub(r"<[^>]+>", "", html_body or "").strip()
        msg.set_content(text or "")
        msg.add_alternative(html_body or "", subtype="html")

    return msg


def _smtp_client():
    host = _env("SMTP_HOST") or ""
    port = int(_env("SMTP_PORT") or ("465" if _env("SMTP_SSL","1") in ("1","true","yes") else "587"))
    user = _env("SMTP_USER")
    pwd = _env("SMTP_PASS")

    use_ssl = (port == 465) or (_env("SMTP_SSL","") in ("1","true","yes"))

    if use_ssl:
        ctx = ssl.create_default_context()
        client = smtplib.SMTP_SSL(host, port, context=ctx, timeout=20)
    else:
        client = smtplib.SMTP(host, port, timeout=20)
        client.ehlo()
        client.starttls(context=ssl.create_default_context())
        client.ehlo()

    if user and pwd:
        client.login(user, pwd)
    return client


def send_message(msg: EmailMessage, *, dryrun: bool = True) -> Dict:
    to_email = msg["To"]
    # suppression check
    sup = is_suppressed(to_email)
    if sup:
        return {"ok": True, "suppressed": True, "to": to_email}

    if dryrun:
        fname = OUTBOX_DIR / (msg["Message-ID"].strip("<>").replace("@","_") + ".eml")
        try:
            with open(fname, "wb") as f:
                f.write(msg.as_bytes())
            return {"ok": True, "dryrun": True, "path": str(fname)}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    # live send
    try:
        client = _smtp_client()
        client.send_message(msg)
        try:
            client.quit()
        except Exception:
            pass
        return {"ok": True, "sent": True, "to": to_email}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def send(to_email: str, subject: str, html_body: str, text_body: str | None = None, *, dryrun: bool = True) -> Dict:
    msg = compose_message(to_email, subject, html_body, text_body)
    return send_message(msg, dryrun=dryrun)
