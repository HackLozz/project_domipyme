from rest_framework import permissions

class IsMerchantOrAdmin(permissions.BasePermission):
    """
    Permite acciones de escritura solo a usuarios con is_staff (admin) o is_merchant.
    Lectura: permitida a todos.
    """
    def has_permission(self, request, view):
        # Lectura abierta
        if view.action in ['list', 'retrieve']:
            return True
        # Para operaciones de escritura requerimos autenticación y rol
        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or getattr(user, 'is_merchant', False)))

    def has_object_permission(self, request, view, obj):
        # Para lecturas cualquier usuario
        if view.action in ['retrieve']:
            return True
        # Admin puede todo
        if request.user and request.user.is_staff:
            return True
        # Si model tiene relación con merchant/owner, validar propiedad:
        # ej: return obj.merchant.user == request.user
        # Como fallback, permitir si user.is_merchant
        return bool(request.user and getattr(request.user, 'is_merchant', False))
