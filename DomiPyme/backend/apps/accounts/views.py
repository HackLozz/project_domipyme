from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()
token_generator = PasswordResetTokenGenerator()

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({'detail':'email required'}, status=400)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'detail':'Si existe cuenta, recibirás correo.'})
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = token_generator.make_token(user)
    reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
    send_mail(
        'Recuperar contraseña',
        f'Ingresa aquí para reiniciar: {reset_link}',
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
    return Response({'detail':'Si existe cuenta, recibirás correo.'})

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    uidb64 = request.data.get('uid')
    token = request.data.get('token')
    password = request.data.get('password')
    if not all([uidb64, token, password]):
        return Response({'detail':'Missing fields'}, status=400)
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except Exception:
        return Response({'detail':'Invalid link'}, status=400)
    if not token_generator.check_token(user, token):
        return Response({'detail':'Invalid token'}, status=400)
    user.set_password(password)
    user.save()
    return Response({'detail':'Password reset successful'})
