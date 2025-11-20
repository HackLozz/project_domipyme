# backend/apps/payments/views.py
from django.http import JsonResponse
from django.views import View

# Intentamos importar el modelo Payment si existe.
# Si hay algún error (modelo inexistente o import error), lo capturamos
# para no romper el arranque del servidor.
try:
    from .models import Payment
except Exception:
    Payment = None

class PaymentListView(View):
    """
    Vista simple que devuelve un JSON con la lista de payments.
    Si el modelo Payment no está definido, devuelve un placeholder para evitar errores al arrancar.
    """
    def get(self, request, *args, **kwargs):
        if Payment is None:
            return JsonResponse({
                "payments": [],
                "detail": "Payment model not available (placeholder response)."
            }, status=200)

        # Ajusta los campos que quieras exponer
        qs = Payment.objects.all().values('id', 'amount', 'status', 'created_at') if hasattr(Payment, 'objects') else []
        data = list(qs)
        return JsonResponse({"payments": data})
