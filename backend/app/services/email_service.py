import os
import smtplib
import ssl
from email.message import EmailMessage


POSTBOX_SMTP_HOST = os.getenv("POSTBOX_SMTP_HOST", "postbox.cloud.yandex.net")
POSTBOX_SMTP_PORT = int(os.getenv("POSTBOX_SMTP_PORT", "587"))
POSTBOX_SMTP_USERNAME = os.getenv("POSTBOX_SMTP_USERNAME")
POSTBOX_SMTP_PASSWORD = os.getenv("POSTBOX_SMTP_PASSWORD")
POSTBOX_FROM_EMAIL = os.getenv("POSTBOX_FROM_EMAIL", "no-reply@example.com")
POSTBOX_FROM_NAME = os.getenv("POSTBOX_FROM_NAME", "VuzHub")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def is_email_configured() -> bool:
    return bool(POSTBOX_SMTP_USERNAME and POSTBOX_SMTP_PASSWORD and POSTBOX_FROM_EMAIL)


def build_frontend_url(path: str) -> str:
    normalized_path = path if path.startswith("/") else f"/{path}"
    return f"{FRONTEND_URL}{normalized_path}"


def send_email_message(to_email: str, subject: str, text_body: str, html_body: str) -> None:
    if not is_email_configured():
        raise RuntimeError(
            "Yandex Cloud Postbox is not configured. "
            "Set POSTBOX_SMTP_USERNAME, POSTBOX_SMTP_PASSWORD and POSTBOX_FROM_EMAIL."
        )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{POSTBOX_FROM_NAME} <{POSTBOX_FROM_EMAIL}>"
    message["To"] = to_email
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    context = ssl.create_default_context()

    try:
        with smtplib.SMTP(POSTBOX_SMTP_HOST, POSTBOX_SMTP_PORT, timeout=30) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(POSTBOX_SMTP_USERNAME, POSTBOX_SMTP_PASSWORD)
            server.send_message(message)
    except Exception as exc:
        raise RuntimeError(f"Postbox SMTP request failed: {exc}") from exc


def send_registration_verification_email(to_email: str, token: str) -> None:
    verification_url = build_frontend_url(f"/verify-email?token={token}")
    subject = "Подтвердите почту для входа в VuzHub"
    text_body = (
        "Здравствуйте!\n\n"
        "Чтобы завершить регистрацию в VuzHub, подтвердите электронную почту по ссылке:\n"
        f"{verification_url}\n\n"
        "Если вы не создавали аккаунт, просто проигнорируйте это письмо."
    )
    html_body = f"""
    <html>
      <body>
        <p>Здравствуйте!</p>
        <p>Чтобы завершить регистрацию в VuzHub, подтвердите электронную почту:</p>
        <p><a href="{verification_url}">Подтвердить почту</a></p>
        <p>Если кнопка не открывается, используйте ссылку:</p>
        <p>{verification_url}</p>
        <p>Если вы не создавали аккаунт, просто проигнорируйте это письмо.</p>
      </body>
    </html>
    """
    send_email_message(to_email, subject, text_body, html_body)


def send_password_change_confirmation_email(to_email: str, token: str) -> None:
    confirmation_url = build_frontend_url(f"/confirm-password-change?token={token}")
    subject = "Подтвердите смену пароля в VuzHub"
    text_body = (
        "Здравствуйте!\n\n"
        "Мы получили запрос на смену пароля в VuzHub.\n"
        "Чтобы применить новый пароль, подтвердите действие по ссылке:\n"
        f"{confirmation_url}\n\n"
        "Если это были не вы, ничего не подтверждайте и смените текущий пароль."
    )
    html_body = f"""
    <html>
      <body>
        <p>Здравствуйте!</p>
        <p>Мы получили запрос на смену пароля в VuzHub.</p>
        <p><a href="{confirmation_url}">Подтвердить смену пароля</a></p>
        <p>Если кнопка не открывается, используйте ссылку:</p>
        <p>{confirmation_url}</p>
        <p>Если это были не вы, ничего не подтверждайте и смените текущий пароль.</p>
      </body>
    </html>
    """
    send_email_message(to_email, subject, text_body, html_body)


def send_password_reset_email(to_email: str, token: str) -> None:
    reset_url = build_frontend_url(f"/reset-password?token={token}")
    subject = "Сброс пароля в VuzHub"
    text_body = (
        "Здравствуйте!\n\n"
        "Мы получили запрос на сброс пароля в VuzHub.\n"
        "Чтобы задать новый пароль, перейдите по ссылке:\n"
        f"{reset_url}\n\n"
        "Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо."
    )
    html_body = f"""
    <html>
      <body>
        <p>Здравствуйте!</p>
        <p>Мы получили запрос на сброс пароля в VuzHub.</p>
        <p><a href="{reset_url}">Сбросить пароль</a></p>
        <p>Если кнопка не открывается, используйте ссылку:</p>
        <p>{reset_url}</p>
        <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
      </body>
    </html>
    """
    send_email_message(to_email, subject, text_body, html_body)
