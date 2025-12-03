from django.contrib import admin
from .models_notification import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'notification_type', 'title', 'read', 'created_at']
    list_filter = ['notification_type', 'read', 'created_at']
    search_fields = ['user__email', 'title', 'message']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('user', 'notification_type', 'title', 'message', 'read')
        }),
        ('Enlaces y Referencias', {
            'fields': ('link_url', 'order_id', 'shop_id', 'product_id'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
