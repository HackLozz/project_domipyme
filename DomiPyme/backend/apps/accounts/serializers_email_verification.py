from rest_framework import serializers
from .models_email_verification import EmailVerification

class EmailVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailVerification
        fields = ['user', 'code', 'created_at', 'is_used']
        read_only_fields = ['created_at', 'is_used']
