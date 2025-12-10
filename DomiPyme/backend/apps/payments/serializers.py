from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id', 'order', 'provider', 'provider_tx_id', 'amount', 'status', 'raw_response', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a cero.")
        if value > 10000000:
            raise serializers.ValidationError("El monto excede el límite permitido.")
        return value

    def validate_status(self, value):
        allowed = {'pending', 'approved', 'rejected'}
        if value not in allowed:
            raise serializers.ValidationError(f"Estado inválido: {value}")
        return value

    def validate_provider(self, value):
        if not value or not value.isalnum():
            raise serializers.ValidationError("Proveedor inválido.")
        return value
