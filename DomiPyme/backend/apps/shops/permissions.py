# backend/apps/shops/permissions.py
"""
Permisos personalizados para shops y products.
"""
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permiso que permite lectura a todos pero escritura solo al owner del objeto.
    El objeto debe tener un campo 'owner' o 'user'.
    """
    def has_object_permission(self, request, view, obj):
        # Lectura permitida para todos
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Escritura: debe ser owner o staff
        if request.user.is_staff:
            return True
        
        owner = getattr(obj, 'owner', getattr(obj, 'user', None))
        return owner == request.user


class IsShopOwnerOrReadOnly(permissions.BasePermission):
    """
    Permiso para Shop: lectura pública, escritura solo para owner o staff.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if request.user.is_staff:
            return True
        
        return obj.owner == request.user


class IsProductShopOwnerOrReadOnly(permissions.BasePermission):
    """
    Permiso para Product: lectura pública, escritura solo si el user es owner de la shop asociada.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if request.user.is_staff:
            return True
        
        shop = getattr(obj, 'shop', None)
        if not shop:
            return False
        
        return getattr(shop, 'owner', None) == request.user
