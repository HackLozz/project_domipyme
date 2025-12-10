import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("apps.core.middleware")

class RequestLoggingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        user = getattr(request, 'user', None)
        logger.info(
            "Request: %s %s | User: %s | IP: %s | UA: %s",
            request.method,
            request.path,
            getattr(user, 'email', None),
            request.META.get('REMOTE_ADDR'),
            request.META.get('HTTP_USER_AGENT'),
        )
        return None

    def process_exception(self, request, exception):
        logger.error(
            "Exception: %s | Path: %s | User: %s | IP: %s | UA: %s | Detail: %s",
            exception.__class__.__name__,
            request.path,
            getattr(request, 'user', None),
            request.META.get('REMOTE_ADDR'),
            request.META.get('HTTP_USER_AGENT'),
            str(exception),
        )
        return None
