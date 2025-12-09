import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from .models import User

CODE_LENGTH = 6

# Generate a random verification code
def generate_code(length=CODE_LENGTH):
    return ''.join(random.choices(string.digits, k=length))

# Send verification email
def send_verification_email(user, code):
    subject = 'Verifica tu correo - DomiPyme'
    context = {
        'user': user,
        'code': code,
        'frontend_base': settings.FRONTEND_BASE_URL,
    }
    html_message = render_to_string('accounts/email_verification.html', context)
    plain_message = f"Hola {user.first_name},\n\nTu código de verificación es: {code}\n\nIngresa este código en la plataforma para activar tu cuenta.\n\nSaludos,\nEquipo DomiPyme"
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )
