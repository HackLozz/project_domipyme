# backend/apps/products/permissions.py
from rest_framework import permissions
from django.core.exceptions import ObjectDoesNotExist

class IsMerchantOrAdmin(permissions.BasePermission):
    """
    Permite acciones de escritura solo a usuarios con is_staff (admin) o is_merchant.
    Además, si el objeto tiene una relación `shop`, valida que request.user sea el owner.
    Lectura: permitida a todos (list/retrieve).
    """

    def has_permission(self, request, view):
        if view.action in ['list', 'retrieve', 'retrieve_by_slug', 'list_by_shop']:
            return True

        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or getattr(user, 'is_merchant', False)))

    def has_object_permission(self, request, view, obj):
        if view.action in ['retrieve']:
            return True

        if request.user and request.user.is_staff:
            return True

        try:
            shop = getattr(obj, 'shop', None)
            if shop:
                owner = getattr(shop, 'owner', None)
                if owner:
                    return owner == request.user
            shop_id = getattr(obj, 'shop_id', None)
            if shop_id:
                pass
        except ObjectDoesNotExist:
            return False

        return bool(request.user and getattr(request.user, 'is_merchant', False))
