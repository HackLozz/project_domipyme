from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal

User = settings.AUTH_USER_MODEL

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending','Pending'),
        ('paid','Paid'),
        ('preparing','Preparing'),
        ('dispatched','Dispatched'),
        ('delivered','Delivered'),
        ('cancelled','Cancelled'),
    ]
    customer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='orders')
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='orders')
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    payment_confirmed = models.BooleanField(default=False)

    def __str__(self):
        return f"Order {self.id} - {self.shop.name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('shops.Product', on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.IntegerField(default=1)
