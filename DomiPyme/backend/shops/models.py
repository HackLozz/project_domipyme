from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator

User = settings.AUTH_USER_MODEL

class Shop(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="shops")
    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    monthly_fee_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

class Category(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.shop.name} - {self.name}"

class Product(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="products")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="products")
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    stock = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name
