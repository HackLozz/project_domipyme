from django.db import models
from django.conf import settings
from decimal import Decimal
from django.core.exceptions import ValidationError


class Cart(models.Model):
    """
    Carrito de compras - puede ser de usuario autenticado o anónimo (session_key)
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='carts'
    )
    session_key = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
            models.Index(fields=['session_key', '-updated_at']),
        ]

    def __str__(self):
        if self.user:
            return f"Cart for {self.user.email}"
        return f"Anonymous Cart ({self.session_key[:8]}...)"

    @property
    def total_items(self):
        """Total de items en el carrito"""
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        """Subtotal del carrito (sin impuestos ni envío)"""
        return sum(item.total_price for item in self.items.all())

    def clear(self):
        """Vaciar el carrito"""
        self.items.all().delete()

    def merge_with(self, other_cart):
        """
        Fusionar otro carrito con este (usado al hacer login)
        """
        for other_item in other_cart.items.all():
            existing_item = self.items.filter(product=other_item.product).first()
            if existing_item:
                # Sumar cantidades
                existing_item.quantity += other_item.quantity
                existing_item.save()
            else:
                # Mover el item a este carrito
                other_item.cart = self
                other_item.save()
        
        # Eliminar el carrito antiguo
        other_cart.delete()


class CartItem(models.Model):
    """
    Item individual en el carrito
    """
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('shops.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price_snapshot = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Precio del producto al momento de agregarlo al carrito"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['cart', 'product']
        indexes = [
            models.Index(fields=['cart', '-created_at']),
        ]

    def __str__(self):
        return f"{self.quantity}x {self.product.name} in {self.cart}"

    @property
    def total_price(self):
        """Precio total de este item (quantity * price_snapshot)"""
        return Decimal(self.quantity) * self.price_snapshot

    def clean(self):
        """Validar que hay suficiente stock"""
        if self.product and self.quantity > self.product.stock:
            raise ValidationError({
                'quantity': f'Solo hay {self.product.stock} unidades disponibles de {self.product.name}'
            })

    def save(self, *args, **kwargs):
        # Establecer price_snapshot si no está definido
        if not self.price_snapshot and self.product:
            self.price_snapshot = self.product.price
        
        # Validar antes de guardar
        self.clean()
        
        super().save(*args, **kwargs)


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("preparing", "Preparing"),
        ("dispatched", "Dispatched"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="orders")
    shop = models.ForeignKey("shops.Shop", on_delete=models.CASCADE, related_name="orders")
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    payment_confirmed = models.BooleanField(default=False)

    def __str__(self):
        return f"Order {self.id} - {self.shop.name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("shops.Product", on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.IntegerField(default=1)
