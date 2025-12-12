# DomiPyme 🛍️

**Plataforma de comercio electrónico para pequeñas y medianas empresas**

[![Tests](https://img.shields.io/badge/tests-30%2F30%20passing-brightgreen)](backend/)
[![Coverage](https://img.shields.io/badge/coverage-~70%25-yellow)](backend/)
[![Django](https://img.shields.io/badge/Django-4.2+-blue)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18+-61dafb)](https://react.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

DomiPyme es una solución completa que permite a comerciantes crear sus propias tiendas virtuales (mini-sites), gestionar productos y procesar órdenes, mientras que los clientes pueden navegar catálogos, agregar productos al carrito y realizar compras.

📊 **[Ver Progreso del Proyecto →](PROGRESS.md)**

---

## 📋 Tabla de Contenidos

1. [Características](#características)
2. [Arquitectura](#arquitectura)
3. [Requisitos](#requisitos)
4. [Instalación](#instalación)
5. [Configuración](#configuración)
6. [Ejecución](#ejecución)
7. [Testing](#testing)
8. [API Documentation](#api-documentation)
9. [Despliegue](#despliegue)
10. [Estructura del Proyecto](#estructura-del-proyecto)
11. [Project Management](#project-management)
12. [Contribuir](#contribuir)

---

## ✨ Características

### Para Comerciantes
- ✅ Registro de cuentas merchant
- ✅ Creación y gestión de tiendas (shops)
- ✅ CRUD completo de productos (nombre, descripción, precio, stock)
- ✅ Mini-sites únicos por slug (ej: `domipyme.com/shop/mi-tienda`)
- ✅ Panel de administración de órdenes

### Para Clientes
- ✅ Registro y autenticación con email
- ✅ Navegación de catálogos públicos
- ✅ Carrito de compras
- ✅ Proceso de checkout
- ✅ Historial de órdenes

### Técnicas
- ✅ API RESTful con Django REST Framework
- ✅ Autenticación JWT con rotación de tokens
- ✅ Frontend React + Vite con interceptores de axios
- ✅ Permisos granulares (ownership validation)
- ✅ Throttling y rate limiting
- ✅ Emails HTML para reset de contraseña
- ✅ Dockerizado con docker-compose
- ✅ CI/CD con GitHub Actions
- ✅ Tests automatizados (pytest)

---

## 🏗️ Arquitectura

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   React     │ ◄─────► │  Django REST │ ◄─────► │  PostgreSQL  │
│   Frontend  │  JWT    │   Framework  │         │   Database   │
│  (Vite 7.2) │         │  (DRF 3.x)   │         │              │
└─────────────┘         └──────────────┘         └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │    SMTP      │
                        │ Email Server │
                        └──────────────┘
```

**Stack tecnológico:**
- **Backend:** Django 4.2+, Django REST Framework, SimpleJWT
- **Frontend:** React 18+, Vite 7.2.2, Axios, React Router
- **Base de datos:** PostgreSQL 15 (producción), SQLite (desarrollo)
- **Servidor web:** Gunicorn
- **Containerización:** Docker + docker-compose
- **CI/CD:** GitHub Actions

---

## 📦 Requisitos

### Desarrollo Local
- Python 3.11+
- Node.js 18+
- SQLite (incluido en Python)

### Producción con Docker
- Docker 20.10+
- Docker Compose 2.0+

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tuusuario/domipyme.git
cd domipyme
```

### 2. Backend Setup

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Copiar archivo de variables de entorno
copy .env.example .env  # Windows
# o
cp .env.example .env    # Linux/Mac

# Editar .env con tus configuraciones
```

### 3. Frontend Setup

```bash
cd frontend

# Instalar dependencias
npm install

# Crear archivo .env.local (opcional)
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1/" > .env.local
```

---

## ⚙️ Configuración

### Variables de Entorno (Backend)

Edita el archivo `backend/.env`:

```env
# Django Core
SECRET_KEY=tu-secret-key-super-segura-cambiala
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Frontend URL
FRONTEND_BASE_URL=http://localhost:5173

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Database (Development - SQLite)
DATABASE_ENGINE=django.db.backends.sqlite3
DATABASE_NAME=db.sqlite3

# Database (Production - PostgreSQL)
# DATABASE_ENGINE=django.db.backends.postgresql
# DATABASE_NAME=domipyme
# DATABASE_USER=domipyme
# DATABASE_PASSWORD=tu-password-segura
# DATABASE_HOST=db
# DATABASE_PORT=5432

# Email (Development - Console)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Email (Production - SMTP)
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=tu-email@gmail.com
# EMAIL_HOST_PASSWORD=tu-app-password
# DEFAULT_FROM_EMAIL=DomiPyme <noreply@domipyme.com>

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

### Migraciones de Base de Datos

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Crear Superusuario

```bash
python manage.py createsuperuser
```

---

## 🎮 Ejecución

### Modo Desarrollo (Backend + Frontend por separado)

**Terminal 1 - Backend:**

```bash
cd backend
python manage.py runserver
# Servidor en http://localhost:8000
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
# Servidor en http://localhost:5173
```

### Modo Producción (Docker Compose)

```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ejecutar migraciones
docker-compose exec web python manage.py migrate

# Crear superusuario
docker-compose exec web python manage.py createsuperuser

# Detener servicios
docker-compose down
```

**URLs:**
- Backend: `http://localhost:8000`
- Admin: `http://localhost:8000/admin`
- Frontend: `http://localhost:5173`

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Ejecutar todos los tests
pytest

# Ejecutar tests con verbose
pytest -v

# Ejecutar tests de una app específica
pytest apps/accounts/tests/

# Ejecutar un test específico
pytest apps/accounts/tests/test_auth.py::test_register_user

# Tests con coverage
pytest --cov=apps --cov-report=html
# Ver reporte: open htmlcov/index.html
```

### Frontend Tests

```bash
cd frontend

# Lint
npm run lint

# Build
npm run build
```

### CI/CD

Los tests se ejecutan automáticamente en GitHub Actions en cada push o PR a `main` o `develop`. Ver `.github/workflows/ci-cd.yml`.

---

## 📚 API Documentation

La documentación completa de la API se encuentra en `API_DOCUMENTATION.md`.

### Endpoints principales:

**Autenticación:**
- `POST /api/v1/auth/register/` - Registro
- `POST /api/v1/auth/login/` - Login (obtener tokens)
- `POST /api/v1/auth/refresh/` - Refrescar token
- `POST /api/v1/auth/password-reset/` - Solicitar reset
- `POST /api/v1/auth/password-reset-confirm/` - Confirmar reset

**Shops:**
- `GET /api/v1/shops/` - Listar shops
- `POST /api/v1/shops/` - Crear shop (merchant)
- `GET /api/v1/shops/{id}/` - Detalle de shop
- `PATCH /api/v1/shops/{id}/` - Actualizar shop (owner)
- `DELETE /api/v1/shops/{id}/` - Eliminar shop (owner)

**Products:**
- `GET /api/v1/products/` - Listar productos
- `POST /api/v1/products/` - Crear producto (shop owner)
- `GET /api/v1/products/{id}/` - Detalle de producto
- `PATCH /api/v1/products/{id}/` - Actualizar producto (owner)
- `DELETE /api/v1/products/{id}/` - Eliminar producto (owner)

**Orders:**
- `GET /api/v1/orders/` - Listar órdenes del usuario
- `POST /api/v1/orders/` - Crear orden

### Ejemplo de uso con cURL:

```bash
# 1. Registrar usuario merchant
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "merchant@example.com",
    "password": "SecurePass123!",
    "re_password": "SecurePass123!",
    "is_merchant": true
  }'

# 2. Login
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "merchant@example.com",
    "password": "SecurePass123!"
  }'

# 3. Crear shop (usando access token)
curl -X POST http://localhost:8000/api/v1/shops/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Tienda",
    "slug": "mi-tienda",
    "description": "La mejor tienda"
  }'
```

---

## 🌐 Despliegue

### Usando Docker Compose en servidor

```bash
# 1. Clonar repositorio en servidor
git clone https://github.com/tuusuario/domipyme.git
cd domipyme

# 2. Configurar variables de entorno
cd backend
cp .env.example .env
nano .env  # Editar con configuración de producción

# 3. Cambiar a PostgreSQL
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=domipyme
DATABASE_USER=domipyme
DATABASE_PASSWORD=<password-segura>
DATABASE_HOST=db
DATABASE_PORT=5432

# 4. Configurar email SMTP
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
# ... resto de configuración

# 5. Iniciar servicios
docker-compose up -d

# 6. Ejecutar migraciones
docker-compose exec web python manage.py migrate

# 7. Recolectar archivos estáticos
docker-compose exec web python manage.py collectstatic --noinput

# 8. Crear superusuario
docker-compose exec web python manage.py createsuperuser
```

### Configurar Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name domipyme.com www.domipyme.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /opt/domipyme/backend/staticfiles/;
    }

    location /media/ {
        alias /opt/domipyme/backend/media/;
    }
}
```

### SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d domipyme.com -d www.domipyme.com
```

---

## 📁 Estructura del Proyecto

```
DomiPyme/
├── backend/                    # Django backend
│   ├── apps/
│   │   ├── accounts/          # Autenticación y usuarios
│   │   │   ├── models.py      # Custom User model
│   │   │   ├── serializers.py # User serializers
│   │   │   ├── views.py       # Auth views (register, login, reset)
│   │   │   ├── tests/         # Tests de autenticación
│   │   │   └── templates/     # Email templates
│   │   ├── shops/             # Gestión de tiendas
│   │   │   ├── models.py      # Shop model
│   │   │   ├── views.py       # Shop CRUD
│   │   │   ├── permissions.py # Custom permissions
│   │   │   └── tests/         # Tests de shops
│   │   ├── products/          # Gestión de productos
│   │   │   ├── models.py      # Product model
│   │   │   ├── views.py       # Product CRUD
│   │   │   └── tests/         # Tests de productos
│   │   ├── orders/            # Gestión de órdenes
│   │   └── payments/          # Integración de pagos
│   ├── config/
│   │   ├── settings.py        # Configuración Django
│   │   ├── urls.py            # URLs principales
│   │   └── wsgi.py            # WSGI config
│   ├── requirements.txt       # Dependencias Python
│   ├── Dockerfile             # Docker image config
│   ├── docker-compose.yml     # Multi-container setup
│   ├── pytest.ini             # Pytest config
│   └── .env.example           # Ejemplo de variables de entorno
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/             # Páginas/vistas
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ShopCreate.jsx
│   │   │   └── Catalog.jsx
│   │   ├── context/           # Context providers
│   │   │   └── AuthProvider.jsx
│   │   ├── App.jsx            # Root component
│   │   └── main.jsx           # Entry point
│   ├── package.json           # Dependencias npm
│   ├── vite.config.js         # Vite config
│   └── eslint.config.js       # ESLint config
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions CI/CD
├── API_DOCUMENTATION.md       # Documentación de API
└── README.md                  # Este archivo
```

---

## 🤝 Contribuir

### Flujo de trabajo

1. Fork el repositorio
2. Crear una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de código

**Backend:**
- Seguir PEP 8
- Usar `black` para formateo
- Usar `flake8` para linting
- Escribir docstrings para funciones/clases
- Tests para nuevas funcionalidades

**Frontend:**
- Seguir ESLint config
- Componentes funcionales con hooks
- PropTypes para validación
- Nombres de archivos en PascalCase para componentes

### Commits

Usar prefijos:
- `Add:` Nueva funcionalidad
- `Fix:` Corrección de bug
- `Update:` Actualización de funcionalidad
- `Refactor:` Refactorización de código
- `Docs:` Cambios en documentación
- `Test:` Agregar o modificar tests

---

## 📊 Project Management

DomiPyme utiliza un sistema estructurado de gestión de tareas y sprints:

### 📁 Documentos de Gestión

- **[BACKLOG.md](./BACKLOG.md)** - Backlog completo de features
  - Lista exhaustiva de tareas por categoría
  - Prioridades (P0-P3)
  - Estimaciones de tiempo
  - Roadmap por versiones
  - 100+ tareas organizadas

- **[SPRINT_TRACKING.md](./SPRINT_TRACKING.md)** - Tracking de sprints
  - Sprint actual y objetivo
  - Tareas en progreso
  - Métricas (velocity, burndown)
  - Retrospectivas y aprendizajes
  - Historial de sprints

- **[TODO.md](./TODO.md)** - Tareas técnicas inmediatas
  - Deuda técnica
  - Bugs conocidos
  - Mejoras rápidas

### 🎯 Metodología

Usamos **Scrum adaptado** con sprints de 2 semanas:

1. **Sprint Planning** - Seleccionar tareas del backlog
2. **Daily Standups** - Sincronización diaria (async en remote)
3. **Sprint Review** - Demo y métricas
4. **Retrospectiva** - Mejora continua

### 📈 Métricas Clave

- **Velocity**: ~20 story points por sprint
- **Test Coverage**: 70%+ (objetivo: 80%)
- **Code Quality**: A grade (SonarQube)
- **Deployment Frequency**: Continuous to dev, weekly to prod

### 🏷️ Sistema de Prioridades

- **P0 (Crítico)** - Bloquea funcionalidad core o seguridad
- **P1 (Alto)** - Feature importante o UX significativa
- **P2 (Medio)** - Mejora incremental
- **P3 (Bajo)** - Nice-to-have

### 📅 Roadmap Ejecutivo

- **v1.1.0** (Mes 1-2): Monetización + UX
- **v1.2.0** (Mes 3-4): Inventory + Product Management
- **v1.3.0** (Mes 5-6): Search + Social Features
- **v1.4.0** (Mes 7-8): Mobile + PWA
- **v1.5.0** (Mes 9-10): Scale + Performance
- **v2.0.0** (Mes 11-12): Enterprise Features

Ver [BACKLOG.md](./BACKLOG.md) para roadmap detallado.

---

## 📄 Licencia

Este proyecto es privado y propietario. No está permitido su uso, copia, modificación o distribución sin autorización expresa.

---

## 🤝 Contribuir

¡Contribuciones son bienvenidas! Lee nuestra [Guía de Contribución](CONTRIBUTING.md) para comenzar.

**Quick Links:**
- 📋 [BACKLOG.md](BACKLOG.md) - Escoger tareas
- 🐛 [GitHub Issues](https://github.com/tuusuario/domipyme/issues) - Reportar bugs
- 💬 [GitHub Discussions](https://github.com/tuusuario/domipyme/discussions) - Preguntas
- 📖 [CONTRIBUTING.md](CONTRIBUTING.md) - Guía completa

**Proceso Simplificado:**
1. Fork el proyecto
2. Crear branch (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'feat: add amazing feature'`)
4. Push a branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

---

## 👥 Equipo

Desarrollado por el equipo de DomiPyme.

---

## 📞 Soporte

Para preguntas o soporte:
- Email: soporte@domipyme.com
- Issues: [GitHub Issues](https://github.com/tuusuario/domipyme/issues)

---

## 🔄 Changelog

### v1.0.0 (2024-01-16)
- ✅ Autenticación JWT completa con rotación
- ✅ CRUD de Shops con permisos
- ✅ CRUD de Products con ownership
- ✅ Reset de contraseña con emails HTML
- ✅ Docker + docker-compose setup
- ✅ CI/CD con GitHub Actions
- ✅ Test suite completo
- ✅ API Documentation
- ✅ Frontend React + Vite
- ✅ Security hardening (throttling, CORS, CSRF)

---

## 📋 Project Management

DomiPyme utiliza una metodología ágil con documentación estructurada para gestión del proyecto:

### 📚 Documentos de Gestión

- **[BACKLOG.md](BACKLOG.md)**: Feature backlog completo con 100+ tareas organizadas por categoría (Security, Product Management, Shopping Experience, etc.). Incluye prioridades (P0-P3), estimaciones de tiempo y roadmap de versiones.

- **[SPRINT_TRACKING.md](SPRINT_TRACKING.md)**: Tracking de sprints con metodología Scrum. Incluye:
  - Sprint Planning: Objetivos, capacidad, user stories
  - Daily Tracking: Progreso diario, blockers, velocity
  - Sprint Review & Retrospective: Demos, métricas, mejoras
  
- **[TODO.md](TODO.md)**: Deuda técnica y tareas de mantenimiento inmediato.

### 🛠️ Scripts de Gestión

Usa el Task Manager interactivo para gestionar el proyecto desde la terminal:

```bash
# Linux/Mac
python3 scripts/task_manager.py

# Windows
python scripts\task_manager.py
```

**Características del Task Manager:**
- 📊 Ver resumen del sprint actual
- 📝 Listar tareas pendientes (Top 10)
- 🔍 Buscar tareas en el backlog
- 📈 Ver métricas del proyecto
- ✍️ Agregar notas al sprint
- 🗂️ Ver categorías del backlog
- 🔧 Ver deuda técnica

Ver [scripts/README.md](scripts/README.md) para documentación completa.

### 🎯 Metodología

**Sprint Duration:** 2 semanas
**Velocity Promedio:** 20 story points
**Definition of Done:**
- ✅ Código escrito y revisado
- ✅ Tests con coverage ≥80%
- ✅ Documentación actualizada
- ✅ API endpoints documentados
- ✅ Sin errores críticos en linting
- ✅ Deployed a staging y validado

### 📅 Roadmap Actual

**v1.1.0** (Sprint 1-2): Monetización básica
- Payment Gateway Integration (Stripe/PayPal)
- Order Management Enhancement
- Real-time Notifications

**v1.2.0** (Sprint 3-4): UX mejorada
- Shopping Cart Enhancement
- Product Images & Media
- Search & Filtering

**v2.0.0** (Sprint 5-8): Escalabilidad
- Multi-language Support
- Analytics Dashboard
- Performance Optimization

Ver [BACKLOG.md](BACKLOG.md) para roadmap completo.

---

## 📝 TODO Técnico

Ver el archivo [TODO.md](TODO.md) para deuda técnica y tareas de mantenimiento.
