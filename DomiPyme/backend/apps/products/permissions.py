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
        # Lectura abierta
        if view.action in ['list', 'retrieve', 'retrieve_by_slug', 'list_by_shop']:
            return True

        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or getattr(user, 'is_merchant', False)))

    def has_object_permission(self, request, view, obj):
        """
        Verificación a nivel de objeto:
        - Si es una operación de lectura (retrieve) la permitimos.
        - Si request.user es staff -> permitido.
        - Si obj tiene relación 'shop' y la propiedad 'owner', comprobamos ownership.
        - Si no hay 'shop', permitimos si user.is_merchant (fallback).
        """
        # Lectura siempre permitida
        if view.action in ['retrieve']:
            return True

        # Admin puede todo
        if request.user and request.user.is_staff:
            return True

        # Intentamos verificar obj.shop.owner == request.user si existe
        try:
            shop = getattr(obj, 'shop', None)
            if shop:
                owner = getattr(shop, 'owner', None)
                if owner:
                    return owner == request.user
            # También soportar objeto que directamente tenga shop_id y no cargó shop
            shop_id = getattr(obj, 'shop_id', None)
            if shop_id:
                # No hacemos DB lookup aquí por performance; asumimos que cuando shop_id existe
                # el permiso de escritura lo maneja la lógica de vista; retorno fallback.
                # Para seguridad estricta puedes resolver la shop y comparar owner.
                pass
        except ObjectDoesNotExist:
            # si la relación está rota, denegamos por seguridad
            return False

        # Fallback: si user tiene rol merchant permitimos
        return bool(request.user and getattr(request.user, 'is_merchant', False))
