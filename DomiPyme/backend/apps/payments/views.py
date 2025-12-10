# backend/apps/payments/views.py
from django.http import JsonResponse
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .serializers import TransactionSerializer

# Intentamos importar el modelo Payment si existe.
# Si hay algún error (modelo inexistente o import error), lo capturamos
# para no romper el arranque del servidor.
try:
    from .models import Payment, Transaction
except Exception:
    Payment = None
    Transaction = None

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

class TransactionListCreateView(APIView):
    """
    Endpoint seguro para listar y crear transacciones de pago.
    Solo usuarios autenticados pueden crear pagos.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        qs = Transaction.objects.all()
        serializer = TransactionSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TransactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Protección: solo el dueño de la orden puede crear la transacción
        order = serializer.validated_data['order']
        if order.customer != request.user:
            return Response({"detail": "No puedes crear pagos para órdenes de otros usuarios."}, status=status.HTTP_403_FORBIDDEN)
        tx = serializer.save()
        return Response(TransactionSerializer(tx).data, status=status.HTTP_201_CREATED)
