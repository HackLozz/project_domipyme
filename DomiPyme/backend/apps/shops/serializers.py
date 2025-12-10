from rest_framework import serializers
from django.apps import apps
from django.conf import settings

# Resolver modelos dinámicamente para evitar import-time errors
Shop = apps.get_model('shops', 'Shop')
Product = apps.get_model('shops', 'Product')
Category = apps.get_model('shops', 'Category') if apps.is_installed('apps.shops') else None
ProductImage = apps.get_model('shops', 'ProductImage') if apps.is_installed('apps.shops') else None
Review = apps.get_model('shops', 'Review') if apps.is_installed('apps.shops') else None
ReviewHelpful = apps.get_model('shops', 'ReviewHelpful') if apps.is_installed('apps.shops') else None

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


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer para reseñas de productos"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True)
    is_helpful = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = (
            'id', 'product', 'product_name', 'user', 'user_email', 'user_name',
            'rating', 'comment', 'verified_purchase', 'helpful_count',
            'is_helpful', 'can_edit', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'user_email', 'user_name', 'product_name', 
                           'verified_purchase', 'helpful_count', 'is_helpful', 
                           'can_edit', 'created_at', 'updated_at')
    
    def get_user_name(self, obj):
        """Devuelve el nombre completo del usuario o email"""
        return obj.user.get_full_name()
    
    def get_is_helpful(self, obj):
        """Devuelve si el usuario actual marcó esta reseña como útil"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ReviewHelpful.objects.filter(review=obj, user=request.user).exists()
        return False
    
    def get_can_edit(self, obj):
        """Devuelve si el usuario actual puede editar esta reseña"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user == request.user or request.user.is_staff
        return False


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
    def validate(self, data):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if request and request.method == 'POST':
            if not (user and user.is_authenticated and (user.is_staff or getattr(user, 'is_merchant', False))):
                raise serializers.ValidationError("Solo admin o merchant pueden crear tiendas.")
        # Sanitizar nombre y descripción
        name = data.get('name', '').strip()
        if not name:
            raise serializers.ValidationError({"name": "El nombre no puede estar vacío."})
        if len(name) < 3:
            raise serializers.ValidationError({"name": "El nombre debe tener al menos 3 caracteres."})
        data['name'] = name
        desc = data.get('description', '')
        if desc:
            data['description'] = desc.strip()
        return data

    def validate_owner(self, value):
        # No permitir cambiar el owner por el serializer
        request = self.context.get('request')
        if request and request.method in ['PUT', 'PATCH']:
            raise serializers.ValidationError("No puedes cambiar el owner de la tienda.")
        return value

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
    
    # Reseñas y ratings
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    rating_distribution = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'shop', 'shop_detail', 'category', 'name', 'sku', 'description',
            'image', 'price', 'stock', 'active', 'created_at',
            'images', 'primary_image_url', 'images_count',
            'avg_rating', 'review_count', 'rating_distribution'
        )
        read_only_fields = ('id', 'created_at', 'images', 'primary_image_url', 'images_count',
                           'avg_rating', 'review_count', 'rating_distribution')
    
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
    
    def get_avg_rating(self, obj):
        """Devuelve el rating promedio del producto"""
        return obj.avg_rating
    
    def get_review_count(self, obj):
        """Devuelve el número de reseñas del producto"""
        return obj.review_count
    
    def get_rating_distribution(self, obj):
        """Devuelve la distribución de ratings"""
        return obj.rating_distribution

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
