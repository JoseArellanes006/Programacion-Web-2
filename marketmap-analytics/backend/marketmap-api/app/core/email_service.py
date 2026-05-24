"""
Servicio de correo electrónico.

Este archivo centraliza el envío de correos del backend.

Se usa principalmente para:
- recuperación de contraseña
- notificaciones futuras del sistema

Implementación:
- usa smtplib de la librería estándar de Python
- ejecuta el envío dentro de asyncio.to_thread para no bloquear FastAPI
"""

import asyncio
import smtplib
from email.message import EmailMessage

from app.core.config import settings
from app.core.exceptions import UnprocessableEntityException


def _validate_smtp_settings() -> None:
    """
    Valida que exista la configuración SMTP mínima.
    """
    if not settings.SMTP_HOST:
        raise UnprocessableEntityException(
            message="SMTP_HOST no está configurado."
        )

    if not settings.SMTP_USERNAME:
        raise UnprocessableEntityException(
            message="SMTP_USERNAME no está configurado."
        )

    if not settings.SMTP_PASSWORD:
        raise UnprocessableEntityException(
            message="SMTP_PASSWORD no está configurado."
        )

    if not settings.SMTP_FROM_EMAIL:
        raise UnprocessableEntityException(
            message="SMTP_FROM_EMAIL no está configurado."
        )


def _send_email_sync(
    to_email: str,
    subject: str,
    text_content: str,
    html_content: str
) -> None:
    """
    Envía un correo usando smtplib.

    Esta función es síncrona, por eso se ejecuta en un hilo separado.
    """
    _validate_smtp_settings()

    message = EmailMessage()

    message["Subject"] = subject
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = to_email

    message.set_content(text_content)
    message.add_alternative(html_content, subtype="html")

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT,
        timeout=20
    ) as smtp:
        if settings.SMTP_USE_TLS:
            smtp.starttls()

        smtp.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD
        )

        smtp.send_message(message)


async def send_email(
    to_email: str,
    subject: str,
    text_content: str,
    html_content: str
) -> None:
    """
    Envía un correo sin bloquear el event loop de FastAPI.
    """
    await asyncio.to_thread(
        _send_email_sync,
        to_email,
        subject,
        text_content,
        html_content
    )


async def send_password_reset_email(
    to_email: str,
    user_name: str,
    reset_url: str
) -> None:
    """
    Envía el correo de recuperación de contraseña.
    """
    subject = "Recuperación de contraseña - MarketMap Analytics"

    text_content = f"""
Hola {user_name}.

Recibimos una solicitud para restablecer la contraseña de su cuenta en MarketMap Analytics.

Para definir una nueva contraseña, abra el siguiente enlace:

{reset_url}

Este enlace expirará en {settings.RESET_PASSWORD_EXPIRE_MINUTES} minutos.

Si usted no solicitó este cambio, ignore este mensaje.
"""

    html_content = f"""
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:620px;margin:0 auto;padding:32px 18px;">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;">
        <h1 style="margin:0 0 12px;font-size:22px;color:#0f172a;">
          Recuperación de contraseña
        </h1>

        <p style="margin:0 0 16px;line-height:1.6;">
          Hola <strong>{user_name}</strong>.
        </p>

        <p style="margin:0 0 18px;line-height:1.6;">
          Recibimos una solicitud para restablecer la contraseña de su cuenta en
          <strong>MarketMap Analytics</strong>.
        </p>

        <p style="margin:0 0 24px;line-height:1.6;">
          Para definir una nueva contraseña, presione el siguiente botón:
        </p>

        <p style="margin:0 0 24px;">
          <a
            href="{reset_url}"
            style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;
            padding:12px 18px;border-radius:10px;font-weight:700;"
          >
            Restablecer contraseña
          </a>
        </p>

        <p style="margin:0 0 12px;line-height:1.6;color:#475569;">
          Este enlace expirará en {settings.RESET_PASSWORD_EXPIRE_MINUTES} minutos.
        </p>

        <p style="margin:0;line-height:1.6;color:#475569;">
          Si usted no solicitó este cambio, ignore este mensaje.
        </p>
      </div>
    </div>
  </body>
</html>
"""

    await send_email(
        to_email=to_email,
        subject=subject,
        text_content=text_content,
        html_content=html_content
    )