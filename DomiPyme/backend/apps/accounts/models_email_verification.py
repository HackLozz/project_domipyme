from django.db import models
from django.utils import timezone
from django.conf import settings

class EmailVerification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_verifications')
    code = models.CharField(max_length=8)
    created_at = models.DateTimeField(default=timezone.now)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email} - {self.code} ({'used' if self.is_used else 'pending'})"

    class Meta:
        indexes = [
            models.Index(fields=['user', 'code']),
        ]
        verbose_name = 'Email Verification'
        verbose_name_plural = 'Email Verifications'
