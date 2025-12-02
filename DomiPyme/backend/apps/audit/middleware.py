"""
Middleware para audit logging automático de acciones críticas.
"""
import json
from django.utils.deprecation import MiddlewareMixin
from .models import log_action


class AuditLoggingMiddleware(MiddlewareMixin):
    """
    Middleware que registra automáticamente acciones importantes.
    Solo registra operaciones POST, PUT, PATCH, DELETE en endpoints específicos.
    """
    
    # Paths que deben ser auditados
    AUDITED_PATHS = [
        '/api/v1/auth/register/',
        '/api/v1/auth/login/',
        '/api/v1/auth/password-reset/',
        '/api/v1/auth/password-reset-confirm/',
        '/api/v1/shops/',
        '/api/v1/products/',
        '/api/v1/orders/',
    ]
    
    # Métodos que deben ser auditados
    AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
    
    def process_response(self, request, response):
        """
        Registra la acción después de que se procese la respuesta.
        """
        # Solo auditar métodos específicos
        if request.method not in self.AUDITED_METHODS:
            return response
        
        # Solo auditar paths específicos
        if not any(request.path.startswith(path) for path in self.AUDITED_PATHS):
            return response
        
        # Solo auditar respuestas exitosas (2xx)
        if not (200 <= response.status_code < 300):
            return response
        
        # Determinar acción
        action = self._get_action(request)
        
        # Determinar modelo y objeto
        model_name, object_id, object_repr = self._extract_object_info(request, response)
        
        # Registrar en audit log
        user = request.user if request.user.is_authenticated else None
        
        log_action(
            user=user,
            action=action,
            model_name=model_name,
            object_id=object_id,
            object_repr=object_repr,
            request=request
        )
        
        return response
    
    def _get_action(self, request):
        """Mapea método HTTP a acción de audit."""
        if request.method == 'POST':
            if 'login' in request.path:
                return 'login'
            elif 'password-reset' in request.path:
                return 'password_reset'
            return 'create'
        elif request.method in ['PUT', 'PATCH']:
            return 'update'
        elif request.method == 'DELETE':
            return 'delete'
        return 'unknown'
    
    def _extract_object_info(self, request, response):
        """Extrae información del objeto de la request/response."""
        model_name = ''
        object_id = None
        object_repr = ''
        
        # Determinar modelo desde path
        if '/shops/' in request.path:
            model_name = 'Shop'
        elif '/products/' in request.path:
            model_name = 'Product'
        elif '/orders/' in request.path:
            model_name = 'Order'
        elif '/auth/register/' in request.path:
            model_name = 'User'
        
        # Intentar extraer ID y representación de response
        try:
            if hasattr(response, 'data') and isinstance(response.data, dict):
                object_id = response.data.get('id')
                object_repr = response.data.get('name') or response.data.get('email') or str(object_id)
        except:
            pass
        
        return model_name, object_id, object_repr
