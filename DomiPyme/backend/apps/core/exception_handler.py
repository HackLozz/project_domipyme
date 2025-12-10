from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger("apps.core.exceptions")

# Central DRF exception handler

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    request = context.get('request')
    view = context.get('view')
    user = getattr(request, 'user', None)
    path = getattr(request, 'path', None)
    method = getattr(request, 'method', None)
    ip = request.META.get('REMOTE_ADDR') if request else None
    ua = request.META.get('HTTP_USER_AGENT') if request else None

    # Log structured error
    logger.error(
        "API error: %s | Path: %s | Method: %s | User: %s | IP: %s | UA: %s | Detail: %s",
        exc.__class__.__name__, path, method, getattr(user, 'email', None), ip, ua, str(exc)
    )

    # Optionally, customize error response
    if response is None:
        return Response({
            "detail": "Error interno del servidor. Si el problema persiste, contacte soporte.",
            "error_type": exc.__class__.__name__,
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        # Add error_type for frontend debugging
        response.data["error_type"] = exc.__class__.__name__
        return response
