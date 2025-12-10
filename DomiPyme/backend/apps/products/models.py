# backend/apps/products/models.py
from django.db import models
from django.utils.text import slugify

class ProductItem(models.Model):
    """
    Modelo de producto principal.
    Representa un producto disponible en la plataforma, con control de stock, precio y visibilidad.
    """
    shop = models.ForeignKey(
        'shops.Shop',
        on_delete=models.CASCADE,
        related_name='products_in_products',
        help_text='Tienda a la que pertenece el producto.',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """
        Genera un slug único basado en el nombre del producto.
        Evita colisiones de slug usando un contador incremental.
        """
        if not self.slug and self.name:
            base = slugify(self.name)[:200]
            slug = base
            counter = 1
            while ProductItem.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
