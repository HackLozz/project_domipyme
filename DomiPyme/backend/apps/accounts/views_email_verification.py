from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models_email_verification import EmailVerification
from .email_verification import generate_code, send_verification_email
from .serializers_email_verification import EmailVerificationSerializer

User = get_user_model()

class RequestEmailVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        if user.is_active:
            return Response({'detail': 'El usuario ya está activo.'}, status=status.HTTP_400_BAD_REQUEST)
        code = generate_code()
        EmailVerification.objects.create(user=user, code=code)
        send_verification_email(user, code)
        return Response({'detail': 'Código enviado al correo.'}, status=status.HTTP_200_OK)

class VerifyEmailCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        code = request.data.get('code', '').strip()
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        verif = EmailVerification.objects.filter(user=user, code=code, is_used=False).order_by('-created_at').first()
        if not verif:
            return Response({'detail': 'Código inválido o expirado.'}, status=status.HTTP_400_BAD_REQUEST)
        # Opcional: Expiración de código (ej. 30 min)
        if (timezone.now() - verif.created_at).total_seconds() > 1800:
            return Response({'detail': 'El código ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)
        verif.is_used = True
        verif.save()
        user.is_active = True
        user.save()
        return Response({'detail': 'Correo verificado. Puedes iniciar sesión.'}, status=status.HTTP_200_OK)
