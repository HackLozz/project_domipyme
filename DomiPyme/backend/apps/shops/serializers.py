from rest_framework import serializers
from django.apps import apps
from django.conf import settings

# Resolver modelos dinámicamente para evitar import-time errors
Shop = apps.get_model('shops', 'Shop')
Product = apps.get_model('shops', 'Product')
Category = apps.get_model('shops', 'Category') if apps.is_installed('apps.shops') else None

# Si por alguna razón Category no existe, definimos un fallback mínimo
if Category is None:
    class _DummyCategory:
        pass
    Category = _DummyCategory


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        # Si Category es dummy, evitamos errores
        fields = ('id', 'name') if hasattr(Category, '_meta') else ()


class ShopSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    products_count = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = (
            'id', 'name', 'slug', 'description', 'address', 'phone',
            'active', 'created_at', 'owner', 'owner_email', 'products_count'
        )
        read_only_fields = ('id', 'created_at', 'owner', 'owner_email', 'products_count')
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True}
        }

    def get_products_count(self, obj):
        try:
            # usa related_name 'products' si existe
            return obj.products.count()
        except Exception:
            return 0


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer principal para Product ligado a Shop.
    Incluye shop como PK y shop_detail anidado (solo lectura).
    """
    # Si el modelo Category existe, mostramos su PK; si no, lo ignoramos
    if hasattr(Product, '_meta') and any(f.name == 'category' for f in Product._meta.get_fields()):
        category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)
    else:
        category = serializers.HiddenField(default=None)

    # shop relación como PK y detalle anidado para respuestas
    shop = serializers.PrimaryKeyRelatedField(queryset=Shop.objects.all())
    shop_detail = ShopSerializer(source='shop', read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'shop', 'shop_detail', 'category', 'name', 'sku', 'description',
            'price', 'stock', 'active', 'created_at'
        )
        read_only_fields = ('id', 'created_at',)

    def validate_price(self, value):
        if value is None:
            return value
        try:
            if float(value) < 0:
                raise serializers.ValidationError("El precio no puede ser negativo.")
        except (TypeError, ValueError):
            raise serializers.ValidationError("Precio inválido.")
        return value

    def validate_stock(self, value):
        if value is None:
            return value
        try:
            if int(value) < 0:
                raise serializers.ValidationError("Stock no puede ser negativo.")
        except (TypeError, ValueError):
            raise serializers.ValidationError("Stock inválido.")
        return value

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)
