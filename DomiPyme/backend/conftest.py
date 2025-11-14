# conftest.py (colócalo en la misma carpeta que pytest.ini)
import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Optional: ensure test DB settings are picked up from env if you use postgres in CI
# e.g., you could override DATABASES here for tests if needed.

django.setup()
