from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.text import slugify
from django.core.validators import MinValueValidator

User = settings.AUTH_USER_MODEL

class Shop(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shops")
    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)

    # Nuevo: flag que controla visibilidad pública / estado de la tienda
    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)[:50]
            slug = base
            count = 1
            while Shop.objects.filter(slug=slug).exclude(pk=getattr(self, 'pk', None)).exists():
                slug = f"{base}-{count}"
                count += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Category(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, blank=True)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0, help_text="Order for display")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = 'Categories'
        unique_together = ['shop', 'slug']

    def __str__(self):
        return f"{self.shop.name} - {self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:120]
        super().save(*args, **kwargs)

    @property
    def product_count(self):
        return self.products.filter(active=True).count()


class Product(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="products")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="products")
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="products/", null=True, blank=True)  # Imagen legacy, mantener por compatibilidad
    price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    stock = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name
    
    @property
    def primary_image(self):
        """Devuelve la imagen principal del producto (la primera con is_primary=True o la primera en orden)"""
        try:
            return self.images.filter(is_primary=True).first() or self.images.order_by('order').first()
        except Exception:
            return None
    
    @property
    def all_images(self):
        """Devuelve todas las imágenes del producto ordenadas"""
        return self.images.order_by('order', 'created_at')


class ProductImage(models.Model):
    """
    Modelo para múltiples imágenes por producto.
    Permite galería de imágenes con orden y imagen principal.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/gallery/%Y/%m/")
    alt_text = models.CharField(max_length=255, blank=True, help_text="Texto alternativo para accesibilidad")
    is_primary = models.BooleanField(default=False, help_text="Imagen principal del producto")
    order = models.IntegerField(default=0, help_text="Orden de visualización (menor primero)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = "Product Image"
        verbose_name_plural = "Product Images"
        indexes = [
            models.Index(fields=['product', 'order']),
            models.Index(fields=['product', 'is_primary']),
        ]

    def __str__(self):
        return f"{self.product.name} - Image {self.order}"
    
    def save(self, *args, **kwargs):
        # Si esta imagen se marca como primary, desmarcar las demás del mismo producto
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).exclude(id=self.id).update(is_primary=False)
        
        # Si es la primera imagen del producto, marcarla como primary automáticamente
        if not self.pk and not ProductImage.objects.filter(product=self.product).exists():
            self.is_primary = True
        
        super().save(*args, **kwargs)
