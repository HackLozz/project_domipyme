# 📊 Análisis Exhaustivo del Proyecto DomiPyme
## Guía Completa de Implementaciones Pendientes

**Fecha:** Diciembre 4, 2025  
**Versión:** 1.0  
**Estado:** MVP Funcional con Backlog Priorizado

---

## 🎯 Indice de Contenidos

1. [Estado Actual del Proyecto](#estado-actual)
2. [Análisis de Componentes](#análisis-de-componentes)
3. [Deficiencias Identificadas](#deficiencias-identificadas)
4. [Plan de Implementación Detallado](#plan-de-implementación)
5. [Roadmap Priorizado](#roadmap-priorizado)
6. [Guías Paso a Paso](#guías-paso-a-paso)

---

## 📈 Estado Actual del Proyecto

### ✅ Lo que FUNCIONA

#### Backend (Django)
- ✅ **Autenticación JWT** - Login, refresh tokens, logout
- ✅ **Modelo de Usuario Custom** - Email-based authentication, roles (customer, merchant, admin)
- ✅ **API RESTful** - Endpoints para auth, productos, tiendas, órdenes, pagos
- ✅ **Permisos Granulares** - Validación de ownership en shopified endpoints
- ✅ **Manejo de Errores** - Responses consistentes con códigos HTTP
- ✅ **Validación de Datos** - Serializers con DRF
- ✅ **Notificaciones Básicas** - Modelo Notification en BD
- ✅ **Estructura Modular** - Apps separadas por dominio

#### Frontend (React + Vite)
- ✅ **Routing** - React Router v6 con rutas públicas y privadas
- ✅ **Auth Context** - Sistema de autenticación con localStorage
- ✅ **Interceptores Axios** - Request/response middleware
- ✅ **Páginas Core** - Home, Login, Register, Dashboard, Catalog, ShopPage, Cart, Checkout
- ✅ **Diseño Coherente** - CSS con variables, sistema de colores, animaciones
- ✅ **Formularios** - ShopCreate, ProductCreate (parciales)
- ✅ **Loading States** - Spinners, skeletons básicos

#### Base de Datos
- ✅ **Modelos Relacionales** - User, Shop, Product, Category, Cart, CartItem, Order, OrderItem, Transaction
- ✅ **Índices Optimizados** - En campos críticos de búsqueda
- ✅ **Constraints Inteligentes** - Foreign keys con CASCADE/SET_NULL

#### DevOps
- ✅ **Docker Support** - docker-compose.yml para dev
- ✅ **Migraciones** - Django migrations configuradas
- ✅ **Tests** - pytest fixtures básicas, conftest.py
- ✅ **CI/CD Setup** - GitHub Actions ready

---

## 🔴 Lo que NO FUNCIONA O FALTA

### CRÍTICO (P0)

#### 🛒 Pagos Completamente No Funcionales
- ❌ **Integración de Payment Gateway** - Stripe/PayPal no implementado
- ❌ **Webhook Handlers** - No hay gestión de callbacks de pagos
- ❌ **Estado de Transacciones** - El modelo existe pero sin flujo real
- ❌ **Seguridad PCI** - Tokenización de tarjetas no configurada
- **Impacto:** Los usuarios PUEDEN hacer checkout pero los pagos no se procesan

#### 🔔 Notificaciones en Tiempo Real - 0%
- ❌ **WebSockets** - Django Channels no instalado
- ❌ **Notificaciones Push** - Sin sistema de alertas
- ❌ **Email de Notificaciones** - Email backend solo console (dev)
- ❌ **Real-time Order Updates** - Los merchants no ven órdenes nuevas en vivo
- **Impacto:** UX pobre para operaciones críticas

#### 📦 Órdenes - Estado Incompleto
- ⚠️ **Estados de Orden** - Modelo existe (pending/confirmed/etc) pero NO completamente implementado
- ❌ **Tracking** - Sin número de seguimiento
- ❌ **Cancelación de Órdenes** - Sin lógica de reembolso
- ❌ **Timeline Visual** - Clientes no ven progreso de su orden
- **Impacto:** Confusión del cliente sobre estado de pedidos

#### 🖼️ Imágenes de Productos - Parcialmente Funcional
- ⚠️ **Campo image** - Existe pero es LEGACY (solo 1 imagen por producto)
- ❌ **Múltiples Imágenes** - Existe modelo ProductImage pero sin CRUD
- ❌ **Optimización** - Sin compresión automática
- ❌ **CDN** - Sin integración de almacenamiento en la nube
- **Impacto:** Las tiendas se ven poco profesionales

---

### ALTO (P1)

#### 🎨 UI/UX Incompleta
- ❌ **Loading States** - Solo spinners básicos, sin skeletons
- ❌ **Validación en Formularios** - Sin feedback visual en tiempo real
- ❌ **Toasts Centralizados** - Cada componente maneja su propio feedback
- ❌ **Error Boundaries** - Muy básico, sin fallback UI
- ❌ **Responsive Design** - Responsive pero no completamente pulida
- ❌ **Accesibilidad (a11y)** - Sin ARIA labels, tabindex inconsistente
- **Impacto:** Aplicación se siente poco profesional

#### 📊 Dashboard de Merchant - Muy Básico
- ❌ **Analytics** - Sin gráficos de ventas
- ❌ **Métricas Clave** - Revenue, AOV, conversion rate missing
- ❌ **Inventory Alerts** - Sin alertas de stock bajo
- ❌ **Top Productos** - Sin visualización de bestsellers
- ❌ **Exportación de Reportes** - Sin CSV/Excel export
- **Impacto:** Los merchants no entienden su negocio

#### 🔍 Búsqueda y Filtros - Ausente
- ❌ **Búsqueda Global** - Sin search box funcional
- ❌ **Filtros por Categoría** - Sin filter UI en Catalog
- ❌ **Filtros por Precio** - Range picker missing
- ❌ **Ordenamiento** - Sin sort options (relevancia, precio, fecha)
- ❌ **Paginación Inteligente** - Solo offset-limit básico
- **Impacto:** Difícil encontrar productos

#### 💳 Carrito de Compras - Incompleto
- ⚠️ **Sincronización** - Solo funciona en un dispositivo
- ❌ **Persistencia Multi-dispositivo** - No sincroniza entre devices
- ❌ **Guardado de Favoritos** - Sin wishlist
- ❌ **Cupones/Descuentos** - Sin aplicación de promociones
- ❌ **Cantidad/Stock Validation** - Sin validar stock en checkout
- **Impacto:** Usuarios pierden carrito cuando cambian dispositivo

#### 👤 Perfil de Usuario - Muy Básico
- ❌ **Perfil Editable** - Sin forma de actualizar datos
- ❌ **Historial de Órdenes** - Existe en BD pero UI muy básica
- ❌ **Direcciones Múltiples** - Sin gestor de addresses
- ❌ **Métodos de Pago Guardados** - Sin wallet
- ❌ **Preferencias** - Sin idioma, newsletter, notificaciones
- **Impacto:** Funcionalidad de usuario limitada

---

### MEDIO (P2)

#### 🔐 Seguridad Incompleta
- ⚠️ **Rate Limiting** - Global pero no granular por usuario
- ❌ **2FA** - Sin two-factor authentication
- ❌ **API Keys** - Sin gestión para integraciones
- ❌ **Password Reset** - Modelo existe pero puede ser más robusto
- ❌ **Audit Logging** - Modelo audit existe pero sin uso
- ❌ **CORS Restrictivo** - Abierto en dev, debe ser configurable
- **Impacto:** Vulnerabilidad moderada

#### 📱 Mobile Responsiveness
- ⚠️ **Responsive Design Básico** - Existe pero no perfecto
- ❌ **Mobile Menu** - Sin hamburger responsive
- ❌ **Touch Optimization** - Botones muy pequeños en mobile
- ❌ **Progressive Web App (PWA)** - Sin soporte offline
- **Impacto:** Mala experiencia en mobile

#### 🌍 Internacionalización (i18n)
- ❌ **Multi-idioma** - Todo hardcoded en español
- ❌ **Zonas Horarias** - Sin soporte para múltiples TZ
- ❌ **Monedas** - Sin soporte multi-currency
- **Impacto:** No escalable globalmente

#### 📧 Email
- ⚠️ **Email Backend** - Solo console en dev
- ❌ **Plantillas HTML** - Muy básicas o inexistentes
- ❌ **Email Queue** - Sin Celery para procesamiento async
- ❌ **Tracking de Email** - Sin open/click tracking
- **Impacto:** Comunicación pobre

#### 🧪 Testing
- ⚠️ **Unit Tests** - Solo 30 tests básicos
- ❌ **E2E Tests** - Sin Playwright/Cypress
- ❌ **Performance Tests** - Sin Locust
- ❌ **Coverage** - ~70%, debería ser 80%+
- **Impacto:** Cambios pueden romper features

---

## 🗂️ Análisis Detallado de Componentes

### Backend - Django

#### ✅ Fortalezas
```
apps/accounts/
  ├─ models.py          → User custom excelente (email-based)
  ├─ serializers.py     → Validación de datos
  ├─ views.py           → Auth endpoints implementados
  └─ models_notification.py → Modelo de notificaciones

apps/products/
  ├─ models.py          → Product, Category excelente
  ├─ views.py           → ProductViewSet funcional
  └─ permissions.py     → Ownership validation

apps/shops/
  ├─ models.py          → Shop, Category excelente
  └─ views.py           → CRUD operacional

apps/orders/
  ├─ models.py          → Cart, CartItem, Order (parcial)
  └─ views.py           → Básico pero funciona

apps/payments/
  ├─ models.py          → Transaction (esqueleto)
  └─ views.py           → Vacío o muy básico
```

#### ❌ Debilidades

1. **Payment Integration** - Transaction model sin lógica Stripe
2. **Notificaciones** - Modelo existe pero sin señales Django
3. **Email** - Backend console, sin HTML templates
4. **Validaciones** - Falta validar stock en checkout
5. **Performance** - Sin caching, sin select_related optimizaciones

---

### Frontend - React

#### ✅ Fortalezas
```
src/
  ├─ App.jsx                    → Router bien estructurado
  ├─ context/AuthProvider.jsx   → Auth context excelente
  ├─ components/
  │  ├─ Api.js                  → Axios con interceptores
  │  ├─ Navbar.jsx              → Navegación funcional
  │  └─ Otros...
  └─ pages/
     ├─ Home.jsx                → Landing bonita
     ├─ Login.jsx, Register.jsx → Autenticación
     ├─ Catalog.jsx             → Listado de productos
     ├─ ShopPage.jsx            → Página individual tienda
     ├─ Cart.jsx                → Carrito funcional
     ├─ Checkout.jsx            → Checkout (sin pago real)
     └─ Dashboard.jsx           → Panel básico
```

#### ❌ Debilidades

1. **Organización de Imports** - Todos los componentes inline en JSX
2. **Estado Global** - Solo AuthContext, sin gestión de otros states
3. **Formularios** - Sin libería (react-hook-form, formik)
4. **Validación** - Validaciones dispersas, no centralizadas
5. **TypeScript** - Sin tipos, todo en JSX vanilla
6. **Componentes Reutilizables** - Buttons, Cards, etc. poco abstrayidos
7. **Temas** - Sin ThemeProvider (hardcoded colors)

---

### Base de Datos

#### Modelos Implementados
```sql
-- Usuarios
User (email-based, custom)

-- Tiendas y Productos
Shop (owner -> User)
Category (shop -> Shop)
Product (shop -> Shop)
ProductImage (product -> Product) -- Existe pero sin CRUD frontend
Review (product -> Product) -- Existe pero sin UI

-- Órdenes
Cart (user | session_key)
CartItem (cart -> Cart, product -> Product)
Order (user -> User, shop -> Shop)
OrderItem (order -> Order, product -> Product)

-- Pagos
Transaction (order -> Order)

-- Auditoría
AuditLog (user -> User, tabla, acción)

-- Notificaciones
Notification (user -> User, tipo)
```

#### Deficiencias
- Falta validación de stock reservado
- Falta histórico de precios
- Falta categorías jerárquicas
- Falta slug único global en categorías
- Sin timestamps de resolución de órdenes

---

## 🚨 Deficiencias Identificadas

### Por Categoría

#### 1️⃣ PAGOS (Mayor Impacto Negativo)
| Deficiencia | Gravedad | Esfuerzo | Impacto |
|---|---|---|---|
| Sin integración Stripe | CRÍTICA | 3 días | Inoperable |
| Sin webhook handlers | CRÍTICA | 1 día | Revenue loss |
| Sin validación 3D Secure | ALTA | 2 días | Fraude |
| Sin manejo de fallos | MEDIA | 1 día | UX pobre |

#### 2️⃣ NOTIFICACIONES
| Deficiencia | Gravedad | Esfuerzo | Impacto |
|---|---|---|---|
| Sin WebSockets | CRÍTICA | 3 días | No realtime |
| Sin email HTML | ALTA | 2 días | Poco profesional |
| Sin notification center UI | ALTA | 2 días | Usuarios pierden alertas |
| Sin Celery async | MEDIA | 2 días | Lentitud |

#### 3️⃣ ÓRDENES
| Deficiencia | Gravedad | Esfuerzo | Impacto |
|---|---|---|---|
| Sin timeline visual | ALTA | 2 días | Confusión cliente |
| Sin tracking number | ALTA | 1 día | Inseguridad |
| Sin cancelación | MEDIA | 2 días | Pérdida de $ |
| Sin validación stock | MEDIA | 1 día | Overbooking |

#### 4️⃣ UX/UI
| Deficiencia | Gravedad | Esfuerzo | Impacto |
|---|---|---|---|
| Sin skeletons | MEDIA | 1 día | Percepción de lentitud |
| Sin form validation visual | MEDIA | 2 días | Errores de usuarios |
| Sin toast centralizados | MEDIA | 1 día | Feedback inconsistente |
| Sin mobile menu | BAJA | 0.5 días | Mobile UX mala |

---

## 📋 Plan de Implementación Detallado

### FASE 1: CRÍTICO (2-3 semanas)
**Objetivo:** Aplicación fully functional con pagos y notificaciones

#### Tarea 1.1: Integración Stripe 📌
**Prioridad:** P0  
**Esfuerzo:** 3 días  
**Depende de:** Nada  

**Entregables:**
1. [ ] Instalar `stripe` en requirements.txt
2. [ ] Crear `.env` variables: `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`
3. [ ] Crear endpoint POST `/api/payments/create-intent/`
4. [ ] Crear endpoint POST `/api/payments/webhook/`
5. [ ] Actualizar modelo `Transaction` con `provider_tx_id`, `status`
6. [ ] Crear signal para actualizar `Order.status` después de pago
7. [ ] Frontend: Integrar `@stripe/react-stripe-js`
8. [ ] Frontend: Crear componente `StripeCheckoutForm.jsx`
9. [ ] Tests: Mocking de Stripe en pytest

**Archivos a crear/modificar:**
```
backend/
  apps/payments/
    ├─ models.py                    # Extender Transaction
    ├─ serializers.py              # PaymentIntentSerializer
    ├─ views.py                     # CreatePaymentIntentView, WebhookView
    ├─ signals.py                  # Signal para actualizar Order
    └─ tests/
        └─ test_payments.py

frontend/
  src/
    ├─ components/StripeCheckoutForm.jsx
    └─ pages/Checkout.jsx          # Integrar Stripe form
```

**Pasos Detallados:**

```python
# 1. Backend: models.py
class Transaction(models.Model):
    PROVIDER_CHOICES = [
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
    ]
    
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE)
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES)
    provider_tx_id = models.CharField(max_length=200, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    raw_response = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

# 2. Backend: serializers.py
class PaymentIntentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    
# 3. Backend: views.py (en payments/views.py)
import stripe
from rest_framework.views import APIView
from rest_framework.response import Response

class CreatePaymentIntentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        order_id = request.data.get('order_id')
        order = Order.objects.get(id=order_id, user=request.user)
        
        intent = stripe.PaymentIntent.create(
            amount=int(order.total * 100),  # en centavos
            currency='usd',
            metadata={'order_id': order.id}
        )
        
        return Response({'client_secret': intent.client_secret})

# 4. Backend: webhook
class StripeWebhookView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except:
            return Response({'error': 'Invalid signature'}, status=400)
        
        if event['type'] == 'payment_intent.succeeded':
            intent = event['data']['object']
            order_id = intent['metadata']['order_id']
            order = Order.objects.get(id=order_id)
            order.status = 'confirmed'
            order.save()
            
        return Response({'received': True})
```

---

#### Tarea 1.2: Sistema de Notificaciones Realtime 📌
**Prioridad:** P0  
**Esfuerzo:** 3 días  
**Depende de:** Nada  

**Entregables:**
1. [ ] Instalar Django Channels + Redis
2. [ ] Crear `routing.py` para WebSocket connections
3. [ ] Crear consumer para órdenes nuevas
4. [ ] Crear evento disparador al crear Order
5. [ ] Frontend: Instalar `ws` para WebSocket
6. [ ] Frontend: Crear hook `useNotificationSocket`
7. [ ] Frontend: UI para notification center

**Archivos a crear:**
```
backend/
  config/
    ├─ asgi.py                    # Integrar Channels
    └─ settings.py               # Configurar Redis

  apps/notifications/
    ├─ __init__.py
    ├─ consumers.py              # WebSocket consumers
    ├─ routing.py                # URL routing WebSocket
    ├─ signals.py                # Disparadores
    └─ tasks.py                  # Celery tasks (email async)
```

**Django Channels Setup:**
```python
# settings.py
INSTALLED_APPS = [
    # ... existentes
    'daphne',  # Antes que django.contrib.
    'channels',
]

ASGI_APPLICATION = 'config.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    }
}

# asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from apps.notifications import routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

asgi_application = get_asgi_application()

application = ProtocolTypeRouter({
    'http': asgi_application,
    'websocket': AuthMiddlewareStack(
        URLRouter(routing.websocket_urlpatterns)
    ),
})
```

---

#### Tarea 1.3: Estados de Órdenes Completos 📌
**Prioridad:** P1  
**Esfuerzo:** 2 días  

**Entregables:**
1. [ ] Extender modelo `Order` con estados: pending → confirmed → preparing → shipped → delivered
2. [ ] Crear field `tracking_number`
3. [ ] Crear migration
4. [ ] Crear API endpoint para actualizar estado (solo merchant)
5. [ ] Crear signal para notificar cliente en cada cambio
6. [ ] Frontend: Mostrar timeline visual

**Modelo Actualizado:**
```python
class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmada'),
        ('preparing', 'Preparando'),
        ('shipped', 'Enviada'),
        ('delivered', 'Entregada'),
        ('cancelled', 'Cancelada'),
    ]
    
    # ... campos existentes
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    shipped_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    
    def can_cancel(self):
        """Permitir cancelación solo en pending/confirmed"""
        return self.status in ['pending', 'confirmed']
```

---

### FASE 2: ALTO IMPACTO (2 semanas)

#### Tarea 2.1: Dashboard Analytics para Merchants 📊
**Prioridad:** P1  
**Esfuerzo:** 3 días  

**Endpoints Backend:**
```python
# GET /api/analytics/dashboard/
{
  "total_revenue": 15000.00,
  "total_orders": 127,
  "average_order_value": 118.11,
  "top_products": [
    {"name": "Laptop", "quantity": 45, "revenue": 45000},
  ],
  "orders_by_status": {
    "pending": 5,
    "confirmed": 10,
    "delivered": 100,
  },
  "sales_chart": {
    "labels": ["Jan", "Feb", ...],
    "data": [1000, 1500, ...]
  }
}

# GET /api/analytics/inventory-alerts/
{
  "low_stock": [
    {"product_id": 1, "name": "Item", "stock": 2, "threshold": 5}
  ]
}
```

**Frontend:**
```jsx
// Dashboard mejorado con Charts (usar recharts o chart.js)
import { BarChart, LineChart } from 'recharts';

export function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    api.get('/analytics/dashboard/').then(r => setData(r.data));
  }, []);
  
  return (
    <div>
      <h2>Dashboard de Ventas</h2>
      <KPICard label="Revenue" value={data?.total_revenue} />
      <LineChart data={data?.sales_chart} />
      <BarChart data={data?.top_products} />
    </div>
  );
}
```

---

#### Tarea 2.2: UX/UI Improvements - Formularios 🎨
**Prioridad:** P1  
**Esfuerzo:** 2 días  

**Mejoras:**
1. [ ] Instalar `react-hook-form` + `zod` para validación
2. [ ] Crear componente `Form` reutilizable
3. [ ] Crear componente `FormField` con validación visual
4. [ ] Refactorizar todos los formularios

**Ejemplo:**
```jsx
// components/FormField.jsx
export function FormField({ label, error, ...props }) {
  return (
    <div>
      <label>{label}</label>
      <input {...props} />
      {error && <span className="error">{error.message}</span>}
    </div>
  );
}

// pages/ShopCreate.jsx (mejorado)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3, 'Min 3 chars'),
  description: z.string().optional(),
});

export default function ShopCreate() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="Shop Name"
        {...register('name')}
        error={errors.name}
      />
    </form>
  );
}
```

---

#### Tarea 2.3: Búsqueda y Filtros 🔍
**Prioridad:** P1  
**Esfuerzo:** 2 días  

**Backend - Mejorar ProductViewSet:**
```python
# apps/products/views.py
class ProductViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['shop', 'category', 'active']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'stock']
    ordering = ['-created_at']
    
    # GET /api/products/?search=laptop&category=1&min_price=100&max_price=5000&ordering=price
```

**Frontend:**
```jsx
// pages/Catalog.jsx (mejorado)
export default function Catalog() {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: 0,
    maxPrice: 10000,
  });
  
  const query = new URLSearchParams(filters).toString();
  
  return (
    <>
      <SearchBar value={filters.search} onChange={...} />
      <Sidebar>
        <CategoryFilter {...} />
        <PriceRangeSlider {...} />
      </Sidebar>
      <ProductGrid
        products={products}
        filters={filters}
      />
    </>
  );
}
```

---

### FASE 3: MEJORAS DE CALIDAD (1 semana)

#### Tarea 3.1: Testing - Alcanzar 85% Coverage 🧪
**Prioridad:** P2  
**Esfuerzo:** 2 días  

**Tests a Escribir:**
```python
# backend/apps/payments/tests/test_payments.py
class PaymentIntentTestCase(TestCase):
    def test_create_payment_intent(self):
        order = Order.objects.create(...)
        response = self.client.post(
            '/api/payments/create-intent/',
            {'order_id': order.id}
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn('client_secret', response.data)

# backend/apps/orders/tests/test_orders.py
class OrderCancelTestCase(TestCase):
    def test_cancel_pending_order(self):
        order = Order.objects.create(status='pending')
        response = self.client.post(f'/api/orders/{order.id}/cancel/')
        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.status, 'cancelled')

# frontend: E2E tests con Playwright
# tests/checkout.spec.ts
test('checkout flow', async ({ page }) => {
  await page.goto('/catalog');
  await page.click('[data-testid="add-to-cart"]');
  await page.goto('/cart');
  await page.click('button:has-text("Checkout")');
  // ... completar checkout
});
```

---

#### Tarea 3.2: Seguridad - 2FA 🔐
**Prioridad:** P2  
**Esfuerzo:** 2 días  

**Implementar TOTP:**
```python
# requirements.txt
pyotp
qrcode

# models.py
class User(AbstractBaseUser, ...):
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True)
    backup_codes = models.JSONField(default=list, blank=True)

# views.py
class Enable2FAView(APIView):
    def post(self, request):
        secret = pyotp.random_base32()
        qr_code = pyotp.totp.TOTP(secret).provisioning_uri()
        return Response({
            'secret': secret,
            'qr_code': qr_code,
            'backup_codes': generate_backup_codes()
        })

class Verify2FAView(APIView):
    def post(self, request):
        totp = pyotp.TOTP(request.user.two_factor_secret)
        if totp.verify(request.data['token']):
            request.user.two_factor_enabled = True
            request.user.save()
            return Response({'success': True})
        return Response({'error': 'Invalid token'}, status=400)
```

---

#### Tarea 3.3: Múltiples Imágenes de Productos 🖼️
**Prioridad:** P2  
**Esfuerzo:** 2 días  

**Frontend - Product Image Management:**
```jsx
// components/ProductImageUploader.jsx
export function ProductImageUploader({ productId }) {
  const [images, setImages] = useState([]);
  
  const handleUpload = async (files) => {
    for (let file of files) {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post(
        `/api/products/${productId}/images/`,
        formData
      );
      setImages([...images, data]);
    }
  };
  
  return (
    <div>
      <input type="file" multiple onChange={e => handleUpload(e.target.files)} />
      <div className="image-grid">
        {images.map(img => (
          <div key={img.id} className="image-item">
            <img src={img.image} alt="" />
            <button onClick={() => deleteImage(img.id)}>Delete</button>
            {img.is_primary && <span>Primary</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 Roadmap Priorizado

### Timeline Recomendado

```
SEMANA 1-2 (CRÍTICO - MVP Payments)
├─ Stripe Integration (3 días)
├─ Notificaciones Realtime (3 días)
└─ Order States Completos (2 días)

SEMANA 3-4 (ALTO IMPACTO)
├─ Analytics Dashboard (3 días)
├─ Form Validation UX (2 días)
├─ Search & Filters (2 días)
└─ Testing Coverage (2 días)

SEMANA 5 (POLISH & SECURITY)
├─ 2FA Implementation (2 días)
├─ Multiple Product Images (2 días)
└─ Mobile Responsiveness (1 día)

SEMANA 6+ (NICE-TO-HAVE)
├─ PWA Support
├─ i18n/Multi-language
├─ Email Queue (Celery)
├─ Admin Analytics
└─ API Documentation Swagger
```

---

## 🛠️ Guías Paso a Paso

### GUÍA 1: Integrar Stripe

#### Paso 1: Setup Inicial

```bash
# 1. Instalar Stripe
pip install stripe

# 2. Obtener keys en https://dashboard.stripe.com/apikeys
# STRIPE_PUBLIC_KEY = pk_live_...
# STRIPE_SECRET_KEY = sk_live_...

# 3. Agregar a .env
echo "STRIPE_PUBLIC_KEY=pk_test_..." >> backend/.env
echo "STRIPE_SECRET_KEY=sk_test_..." >> backend/.env

# 4. Instalar Stripe en requirements.txt
echo "stripe>=5.0" >> backend/requirements.txt
```

#### Paso 2: Backend - Crear Endpoints

**Archivo:** `backend/apps/payments/views.py`
```python
import stripe
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from apps.orders.models import Order

stripe.api_key = settings.STRIPE_SECRET_KEY

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_intent(request):
    """Crear intent de pago con Stripe"""
    try:
        order_id = request.data.get('order_id')
        order = Order.objects.get(id=order_id, user=request.user)
        
        # Convertir a centavos (Stripe usa la unidad más pequeña)
        amount_cents = int(order.total * 100)
        
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency='usd',
            metadata={
                'order_id': order.id,
                'user_id': request.user.id,
            }
        )
        
        return Response({
            'client_secret': intent.client_secret,
            'public_key': settings.STRIPE_PUBLIC_KEY,
        })
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """Manejar webhooks de Stripe"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return Response({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError:
        return Response({'error': 'Invalid signature'}, status=400)
    
    # Manejar eventos
    if event['type'] == 'payment_intent.succeeded':
        intent = event['data']['object']
        order_id = intent['metadata'].get('order_id')
        order = Order.objects.get(id=order_id)
        order.status = 'confirmed'
        order.paid = True
        order.save()
        
        # AQUÍ: Disparar notificación al merchant
        
    elif event['type'] == 'payment_intent.payment_failed':
        intent = event['data']['object']
        order_id = intent['metadata'].get('order_id')
        # Manejar pago fallido
        
    return Response({'received': True})
```

**Archivo:** `backend/apps/payments/urls.py`
```python
from django.urls import path
from . import views

urlpatterns = [
    path('create-intent/', views.create_payment_intent, name='create-intent'),
    path('webhook/', views.stripe_webhook, name='webhook'),
]
```

**Archivo:** `backend/config/urls.py` (agregar)
```python
urlpatterns = [
    # ... existentes
    path('api/payments/', include('apps.payments.urls')),
]
```

---

#### Paso 3: Frontend - Integrar Checkout

**Instalar dependencias:**
```bash
cd frontend
npm install @stripe/react-stripe-js @stripe/js
```

**Archivo:** `frontend/src/components/StripeCheckoutForm.jsx`
```jsx
import React, { useState } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import api from './Api';

export default function StripeCheckoutForm({ orderId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      // 1. Obtener client secret
      const { data } = await api.post('/api/payments/create-intent/', {
        order_id: orderId,
      });

      // 2. Confirmar pago con Stripe
      const { error: paymentError, paymentIntent } =
        await stripe.confirmCardPayment(data.client_secret, {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        });

      if (paymentError) {
        setError(paymentError.message);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button disabled={loading || !stripe}>
        {loading ? 'Processing...' : `Pay $${amount}`}
      </button>
    </form>
  );
}
```

**Archivo:** `frontend/src/pages/Checkout.jsx` (actualizar)
```jsx
import { loadStripe } from '@stripe/js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckoutForm from '../components/StripeCheckoutForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function Checkout() {
  // ... código existente

  return (
    <>
      <Elements stripe={stripePromise}>
        <StripeCheckoutForm
          orderId={orderId}
          amount={total}
          onSuccess={() => navigate('/orders')}
        />
      </Elements>
    </>
  );
}
```

**Archivo:** `frontend/.env.local` (agregar)
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:8000
```

---

#### Paso 4: Testing

**Archivo:** `backend/apps/payments/tests.py`
```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.orders.models import Order
from unittest.mock import patch, MagicMock

User = get_user_model()

class StripePaymentTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123'
        )
        self.order = Order.objects.create(
            user=self.user,
            total=100.00,
            status='pending'
        )
        self.client.login(email='test@test.com', password='testpass123')

    @patch('stripe.PaymentIntent.create')
    def test_create_payment_intent(self, mock_create):
        mock_create.return_value = {
            'id': 'pi_test123',
            'client_secret': 'pi_test123_secret',
        }
        
        response = self.client.post(
            '/api/payments/create-intent/',
            {'order_id': self.order.id},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('client_secret', response.json())
        mock_create.assert_called_once()

    @patch('stripe.Webhook.construct_event')
    def test_webhook_payment_succeeded(self, mock_webhook):
        mock_webhook.return_value = {
            'type': 'payment_intent.succeeded',
            'data': {
                'object': {
                    'metadata': {'order_id': str(self.order.id)}
                }
            }
        }
        
        response = self.client.post(
            '/api/payments/webhook/',
            {},
            HTTP_STRIPE_SIGNATURE='test_sig'
        )
        
        self.assertEqual(response.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'confirmed')
```

---

### GUÍA 2: Implementar Django Channels para Notificaciones Realtime

#### Paso 1: Instalación y Configuración

```bash
# Instalar dependencias
pip install channels channels-redis daphne

# Instalar Redis (Windows via WSL o Docker)
docker run -d -p 6379:6379 redis
```

**Archivo:** `backend/requirements.txt` (agregar)
```txt
channels>=4.0
channels-redis>=4.0
daphne>=4.0
```

#### Paso 2: Configurar ASGI y Settings

**Archivo:** `backend/config/settings.py` (actualizar)
```python
# Agregar al inicio de INSTALLED_APPS
INSTALLED_APPS = [
    "daphne",  # DEBE ser primero
    "django.contrib.admin",
    # ... resto de apps
    "apps.notifications",  # Crear esta app
]

# Al final del archivo
ASGI_APPLICATION = "config.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}
```

**Archivo:** `backend/config/asgi.py` (reemplazar)
```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

django_asgi_app = get_asgi_application()

from apps.notifications.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
```

#### Paso 3: Crear App de Notificaciones

```bash
python manage.py startapp notifications apps/notifications
```

**Archivo:** `backend/apps/notifications/__init__.py`
```python
default_app_config = 'apps.notifications.apps.NotificationsConfig'
```

**Archivo:** `backend/apps/notifications/consumers.py`
```python
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()

class OrderNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        
        if not user.is_authenticated:
            await self.close()
            return
        
        # Crear group name basado en user_id
        self.room_group_name = f"notifications_{user.id}"
        self.user = user
        
        # Unirse al grupo
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Recibir mensajes del cliente (heartbeat, etc)"""
        pass

    # Métodos llamados desde signals
    async def order_notification(self, event):
        """Enviar notificación de orden"""
        await self.send(text_data=json.dumps(event['message']))

    async def status_update(self, event):
        """Enviar actualización de estado"""
        await self.send(text_data=json.dumps(event['message']))
```

**Archivo:** `backend/apps/notifications/routing.py`
```python
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/notifications/$", consumers.OrderNotificationConsumer.as_asgi()),
]
```

**Archivo:** `backend/apps/notifications/signals.py`
```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.orders.models import Order

@receiver(post_save, sender=Order)
def notify_merchant_new_order(sender, instance, created, **kwargs):
    """Notificar al merchant cuando hay una orden nueva"""
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_{instance.shop.owner.id}",
            {
                "type": "order_notification",
                "message": {
                    "type": "new_order",
                    "order_id": instance.id,
                    "total": str(instance.total),
                    "timestamp": instance.created_at.isoformat(),
                }
            }
        )

@receiver(post_save, sender=Order)
def notify_customer_status_change(sender, instance, update_fields, **kwargs):
    """Notificar al cliente cuando la orden cambia de estado"""
    if update_fields and 'status' in update_fields:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_{instance.user.id}",
            {
                "type": "status_update",
                "message": {
                    "type": "order_status",
                    "order_id": instance.id,
                    "status": instance.status,
                    "timestamp": instance.updated_at.isoformat(),
                }
            }
        )
```

**Archivo:** `backend/apps/notifications/apps.py`
```python
from django.apps import AppConfig

class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notifications"

    def ready(self):
        import apps.notifications.signals
```

#### Paso 4: Frontend - Conectar WebSocket

**Archivo:** `frontend/src/hooks/useNotifications.js`
```javascript
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthProvider';

export function useNotifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//localhost:8000/ws/notifications/`);

    ws.onopen = () => {
      console.log('Notificación WebSocket conectado');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications((prev) => [notification, ...prev]);
      
      // Auto-remover después de 5 segundos
      setTimeout(() => {
        setNotifications((prev) => prev.slice(0, -1));
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [token]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, clearNotifications };
}
```

**Archivo:** `frontend/src/components/NotificationCenter.jsx`
```jsx
import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationCenter() {
  const { notifications } = useNotifications();

  return (
    <div className="notification-center">
      {notifications.map((notif, i) => (
        <div key={i} className="toast">
          {notif.type === 'new_order' && (
            <span>🎉 Nueva orden #{notif.order_id}</span>
          )}
          {notif.type === 'order_status' && (
            <span>📦 Tu orden #{notif.order_id} está {notif.status}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Checklist de Implementación

### Fase 1 - Pagos
- [ ] Stripe API keys configuradas
- [ ] Backend endpoints creados
- [ ] Frontend Stripe form integrado
- [ ] Webhooks funcionando
- [ ] Tests escritos y pasando

### Fase 1 - Notificaciones
- [ ] Redis instalado y corriendo
- [ ] Django Channels configurado
- [ ] WebSocket consumer implementado
- [ ] Signals enviando eventos
- [ ] Frontend WebSocket conectado
- [ ] UI mostrando notificaciones

### Fase 2 - Analytics
- [ ] Backend endpoints de analytics
- [ ] Gráficos de ventas funcionando
- [ ] Métodos KPI mostrándose
- [ ] Alertas de stock bajo funcionando

### Fase 2 - Formularios
- [ ] react-hook-form instalado
- [ ] Validación con Zod
- [ ] Componentes reutilizables creados
- [ ] Todos los formularios refactorizados

### Fase 2 - Búsqueda
- [ ] Backend filters implementados
- [ ] Frontend UI de filtros
- [ ] Search funcionando
- [ ] Ordenamiento implementado

---

## 📚 Recursos Útiles

### Documentación Oficial
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django Channels](https://channels.readthedocs.io/)
- [Stripe Python SDK](https://stripe.com/docs/stripe-js)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

### Librerías Recomendadas

```txt
# Backend
celery>=5.3  # Task queue para async jobs
redis>=4.5  # Cache y channels
sentry-sdk>=1.25  # Error tracking
django-filter>=23.0  # Filtrado avanzado
djangorestframework-simplejwt>=5.3  # JWT ya tienen

# Frontend
recharts>=2.10  # Gráficos
react-hook-form>=7.45  # Formularios
zod>=3.22  # Validación
framer-motion>=10.0  # Animaciones
@headlessui/react>=1.7  # UI Components

# Dev/Testing
pytest-cov>=4.1  # Coverage reporting
pytest-asyncio>=0.21  # Async tests
playwright>=1.40  # E2E testing
```

---

## 🚀 Próximos Pasos

1. **Semana 1:** Integrar Stripe completamente
2. **Semana 2:** Implementar WebSockets para notificaciones realtime
3. **Semana 3:** Analytics dashboard + mejorar UX
4. **Semana 4:** Tests y seguridad (2FA)
5. **Semana 5+:** Features secondary

---

## 📞 Support

Para dudas sobre implementación específica, consulta:
- README.md - Setup básico
- API_DOCUMENTATION.md - Endpoints
- CONTRIBUTING.md - Guías de desarrollo
- Issues en GitHub - Community support

**Última actualización:** 2025-12-04
**Mantenedor:** Equipo DomiPyme
