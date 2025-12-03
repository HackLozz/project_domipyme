from django.contrib import admin
from .models import Shop, Product, Category, ProductImage


class ProductImageInline(admin.TabularInline):
    """Inline para gestionar imágenes desde el admin de productos"""
    model = ProductImage
    extra = 1
    fields = ('image', 'alt_text', 'is_primary', 'order')
    readonly_fields = ('created_at',)


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'owner', 'active', 'created_at')
    list_filter = ('active', 'created_at')
    search_fields = ('name', 'slug', 'owner__email')
    readonly_fields = ('slug', 'created_at')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'shop', 'category', 'price', 'stock', 'active', 'created_at')
    list_filter = ('active', 'shop', 'category', 'created_at')
    search_fields = ('name', 'sku', 'description')
    readonly_fields = ('created_at',)
    inlines = [ProductImageInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'shop', 'slug', 'active', 'order', 'created_at')
    list_filter = ('active', 'shop', 'created_at')
    search_fields = ('name', 'slug', 'description')
    readonly_fields = ('slug', 'created_at', 'updated_at')
    ordering = ('shop', 'order', 'name')


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'is_primary', 'order', 'created_at')
    list_filter = ('is_primary', 'created_at')
    search_fields = ('product__name', 'alt_text')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('product', 'order')
