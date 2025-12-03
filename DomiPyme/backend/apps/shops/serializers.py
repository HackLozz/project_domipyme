from rest_framework import serializers
from django.apps import apps
from django.conf import settings

# Resolver modelos dinámicamente para evitar import-time errors
Shop = apps.get_model('shops', 'Shop')
Product = apps.get_model('shops', 'Product')
Category = apps.get_model('shops', 'Category') if apps.is_installed('apps.shops') else None
ProductImage = apps.get_model('shops', 'ProductImage') if apps.is_installed('apps.shops') else None

# Si por alguna razón Category no existe, definimos un fallback mínimo
if Category is None:
    class _DummyCategory:
        pass
    Category = _DummyCategory


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer para imágenes de productos"""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = ('id', 'product', 'image', 'image_url', 'alt_text', 'is_primary', 'order', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_image_url(self, obj):
        """Devuelve URL completa de la imagen"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class CategorySerializer(serializers.ModelSerializer):
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = (
            'id', 'shop', 'shop_name', 'name', 'slug', 'description',
            'active', 'order', 'product_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at', 'shop_name', 'product_count')


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
    
    # Imágenes del producto
    images = ProductImageSerializer(many=True, read_only=True)
    primary_image_url = serializers.SerializerMethodField()
    images_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'shop', 'shop_detail', 'category', 'name', 'sku', 'description',
            'image', 'price', 'stock', 'active', 'created_at',
            'images', 'primary_image_url', 'images_count'
        )
        read_only_fields = ('id', 'created_at', 'images', 'primary_image_url', 'images_count')
    
    def get_primary_image_url(self, obj):
        """Devuelve URL de la imagen principal"""
        primary_img = obj.primary_image
        if primary_img and primary_img.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary_img.image.url)
            return primary_img.image.url
        # Fallback a la imagen legacy si existe
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_images_count(self, obj):
        """Devuelve el número de imágenes del producto"""
        return obj.images.count()

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
