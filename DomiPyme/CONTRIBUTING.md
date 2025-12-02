# Guía de Contribución - DomiPyme

¡Gracias por tu interés en contribuir a DomiPyme! Este documento te guiará en el proceso.

---

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [Cómo Empezar](#cómo-empezar)
3. [Proceso de Desarrollo](#proceso-de-desarrollo)
4. [Estándares de Código](#estándares-de-código)
5. [Testing](#testing)
6. [Documentación](#documentación)
7. [Pull Requests](#pull-requests)
8. [Reportar Bugs](#reportar-bugs)

---

## 📜 Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que mantengas un comportamiento respetuoso y profesional.

**Esperamos:**
- 🤝 Respeto mutuo y colaboración
- 💬 Comunicación clara y constructiva
- 🎯 Enfoque en soluciones, no en problemas
- 📚 Compartir conocimiento y aprender de otros

---

## 🚀 Cómo Empezar

### 1. Setup Inicial

```bash
# Fork y clone el repositorio
git clone https://github.com/TU_USUARIO/domipyme.git
cd domipyme

# Instalar dependencias backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Instalar dependencias frontend
cd ../frontend
npm install

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar .env con tus valores
```

### 2. Explorar el Proyecto

```bash
# Ver estado actual del proyecto
python scripts/task_manager.py

# Leer documentación de gestión
cat BACKLOG.md          # Features completas
cat SPRINT_TRACKING.md  # Progreso de sprints
cat TODO.md             # Deuda técnica
```

### 3. Escoger una Tarea

**Opciones:**
- 🟢 **Good First Issue**: Busca issues etiquetados como `good-first-issue`
- 📋 **Backlog**: Revisa [BACKLOG.md](BACKLOG.md) para features priorizadas
- 🐛 **Bugs**: Checa los issues abiertos con etiqueta `bug`
- 📖 **Docs**: Mejoras de documentación siempre son bienvenidas

---

## 🔄 Proceso de Desarrollo

### Workflow Git

```bash
# 1. Crear rama desde main
git checkout main
git pull origin main
git checkout -b feature/nombre-descriptivo

# 2. Hacer commits atómicos
git add .
git commit -m "feat: descripción clara del cambio"

# 3. Mantener rama actualizada
git fetch origin
git rebase origin/main

# 4. Push y crear PR
git push origin feature/nombre-descriptivo
# Crear Pull Request en GitHub
```

### Convención de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agregar endpoint de reseñas de productos
fix: corregir cálculo de impuestos en checkout
docs: actualizar guía de instalación
test: agregar tests para order cancellation
refactor: simplificar lógica de permisos en shops
perf: optimizar queries en product listing
style: aplicar formato black a payments app
chore: actualizar dependencias de seguridad
```

**Estructura:**
```
<tipo>(<scope opcional>): <descripción corta>

[cuerpo opcional con más detalles]

[footer opcional con breaking changes o referencias]
```

**Ejemplos:**
```
feat(payments): integrar Stripe checkout
fix(auth): corregir refresh token expiration
docs(api): documentar endpoint de orders
test(shops): agregar tests para slug collision
```

---

## 📐 Estándares de Código

### Backend (Django/Python)

**Estilo:**
- PEP 8 compliance
- Black formatter (line length 88)
- isort para imports
- Type hints cuando sea apropiado

```python
# ✅ Bueno
def create_order(
    user: User,
    shop: Shop,
    items: list[OrderItem]
) -> Order:
    """
    Create a new order for the given user and shop.
    
    Args:
        user: The authenticated user
        shop: The shop where the order is placed
        items: List of items in the order
        
    Returns:
        The created Order instance
        
    Raises:
        ValidationError: If items are invalid
    """
    # Validate items
    if not items:
        raise ValidationError("Order must have at least one item")
    
    # Create order
    order = Order.objects.create(
        user=user,
        shop=shop,
        status='pending'
    )
    
    # Add items
    for item in items:
        order.items.add(item)
    
    return order

# ❌ Malo
def create_order(u, s, i):
    o = Order.objects.create(user=u, shop=s, status='pending')
    for x in i:
        o.items.add(x)
    return o
```

**Estructura de Vistas:**
```python
# APIViews con docstrings claros
class OrderCreateView(APIView):
    """
    Create a new order.
    
    POST /api/orders/
    
    Permissions:
        - IsAuthenticated
        
    Returns:
        201: Order created successfully
        400: Invalid data
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = OrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(user=request.user)
        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )
```

**Serializers:**
```python
class OrderSerializer(serializers.ModelSerializer):
    # Campos explícitos
    user = UserSerializer(read_only=True)
    items = OrderItemSerializer(many=True)
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'shop', 'items', 'total', 'status', 'created_at']
        read_only_fields = ['id', 'total', 'created_at']
    
    def validate_items(self, value):
        """Validate at least one item exists."""
        if not value:
            raise serializers.ValidationError("Order must have items")
        return value
```

### Frontend (React/JavaScript)

**Estilo:**
- ESLint + Prettier
- Functional components con hooks
- PropTypes o TypeScript
- Nombres descriptivos

```jsx
// ✅ Bueno
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { fetchOrders } from '../api/orders';

function OrderList({ userId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await fetchOrders(userId);
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrders();
  }, [userId]);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div className="order-list">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

OrderList.propTypes = {
  userId: PropTypes.number.isRequired,
};

export default OrderList;

// ❌ Malo
function OL({ u }) {
  const [o, setO] = useState([]);
  useEffect(() => {
    fetch(`/api/orders/${u}`).then(r => r.json()).then(d => setO(d));
  }, []);
  return <div>{o.map(x => <div>{x.id}</div>)}</div>;
}
```

---

## 🧪 Testing

### Requisitos
- ✅ **Cobertura mínima:** 80% para nuevo código
- ✅ **Tests deben pasar:** 100% antes de PR
- ✅ **Tests unitarios:** Para lógica de negocio
- ✅ **Tests de integración:** Para flows completos

### Backend Testing

```python
# tests/test_orders.py
import pytest
from django.contrib.auth import get_user_model
from apps.orders.models import Order
from apps.shops.models import Shop

User = get_user_model()

@pytest.mark.django_db
class TestOrderCreation:
    """Test suite for order creation."""
    
    def test_authenticated_user_can_create_order(self, api_client, customer_user, shop):
        """Test that authenticated customer can create order."""
        # Arrange
        api_client.force_authenticate(user=customer_user)
        data = {
            'shop': shop.id,
            'items': [
                {'product_id': 1, 'quantity': 2},
            ]
        }
        
        # Act
        response = api_client.post('/api/orders/', data, format='json')
        
        # Assert
        assert response.status_code == 201
        assert Order.objects.filter(user=customer_user).exists()
    
    def test_anonymous_user_cannot_create_order(self, api_client, shop):
        """Test that anonymous users cannot create orders."""
        # Arrange
        data = {'shop': shop.id, 'items': []}
        
        # Act
        response = api_client.post('/api/orders/', data, format='json')
        
        # Assert
        assert response.status_code == 401
```

**Correr tests:**
```bash
# Todos los tests
pytest

# Con coverage
pytest --cov=apps --cov-report=html

# Solo un archivo
pytest apps/orders/tests/test_orders.py

# Solo una clase
pytest apps/orders/tests/test_orders.py::TestOrderCreation

# Solo un test
pytest apps/orders/tests/test_orders.py::TestOrderCreation::test_authenticated_user_can_create_order
```

### Frontend Testing

```jsx
// OrderList.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import OrderList from './OrderList';
import * as api from '../api/orders';

describe('OrderList', () => {
  it('displays loading state initially', () => {
    render(<OrderList userId={1} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
  
  it('displays orders after successful fetch', async () => {
    // Mock API
    vi.spyOn(api, 'fetchOrders').mockResolvedValue([
      { id: 1, total: 100, status: 'pending' },
      { id: 2, total: 200, status: 'completed' },
    ]);
    
    render(<OrderList userId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Order #1/i)).toBeInTheDocument();
      expect(screen.getByText(/Order #2/i)).toBeInTheDocument();
    });
  });
  
  it('displays error message on fetch failure', async () => {
    vi.spyOn(api, 'fetchOrders').mockRejectedValue(new Error('Network error'));
    
    render(<OrderList userId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

---

## 📚 Documentación

### Documenta Siempre
- 📖 Docstrings en funciones y clases
- 📝 Comentarios para lógica compleja
- 📋 Actualizar README si cambias setup
- 🔗 Actualizar API docs si cambias endpoints

### API Documentation

Cuando agregues/modifiques endpoints, actualiza `docs/API.md`:

```markdown
### Create Order

**Endpoint:** `POST /api/orders/`

**Description:** Create a new order for the authenticated user.

**Authentication:** Required (JWT)

**Permissions:** IsAuthenticated

**Request Body:**
```json
{
  "shop": 1,
  "items": [
    {
      "product_id": 5,
      "quantity": 2
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": 42,
  "shop": 1,
  "user": 10,
  "items": [...],
  "total": 150.00,
  "status": "pending",
  "created_at": "2025-01-17T10:30:00Z"
}
```

**Errors:**
- `400`: Invalid data (missing shop, empty items, etc.)
- `401`: Not authenticated
- `404`: Shop not found
```

---

## 🔀 Pull Requests

### Checklist Pre-PR

Antes de crear un PR, asegúrate de:

- [ ] ✅ Código sigue los estándares (lint passing)
- [ ] ✅ Tests agregados y pasando (100%)
- [ ] ✅ Coverage ≥80% para nuevo código
- [ ] ✅ Documentación actualizada
- [ ] ✅ Sin conflictos con `main`
- [ ] ✅ Commits son atómicos y descriptivos
- [ ] ✅ Branch está actualizado (rebase con main)

### Estructura del PR

**Título:**
```
feat: agregar sistema de reseñas de productos
```

**Descripción Template:**
```markdown
## 🎯 Objetivo
Implementar sistema de reseñas para que clientes puedan calificar productos.

## 🔧 Cambios
- Agregado modelo `ProductReview` con rating y comentario
- Implementado endpoint `POST /api/products/{id}/reviews/`
- Agregado componente `ReviewForm` en frontend
- Tests para CRUD de reviews con permissions

## 📸 Screenshots
[Si aplica, agregar capturas de UI]

## ✅ Checklist
- [x] Tests agregados y pasando
- [x] Documentación actualizada
- [x] Sin warnings de linting
- [x] API docs actualizados

## 🔗 Referencias
- Closes #123
- Related to #124
```

### Code Review

**Para Revisores:**
- 🔍 Verifica lógica y edge cases
- 🧪 Revisa cobertura de tests
- 📖 Valida documentación
- 💡 Sugiere mejoras constructivamente
- ⚡ Aprueba si cumple estándares

**Para Autores:**
- 💬 Responde a comentarios constructivamente
- 🔄 Implementa cambios solicitados
- 🙏 Agradece el feedback

---

## 🐛 Reportar Bugs

### Template de Issue

```markdown
**Descripción del Bug:**
Al intentar crear una orden con productos de múltiples tiendas, el sistema retorna error 500.

**Pasos para Reproducir:**
1. Login como customer
2. Agregar producto de Shop A al carrito
3. Agregar producto de Shop B al carrito
4. Ir a checkout
5. Clic en "Confirmar Orden"

**Comportamiento Esperado:**
Debería crear 2 órdenes separadas (una por shop) o mostrar mensaje claro de que no se pueden mezclar shops.

**Comportamiento Actual:**
Error 500 con mensaje "Internal Server Error"

**Screenshots:**
[Si aplica]

**Ambiente:**
- OS: Windows 10
- Browser: Chrome 120
- Backend: Django 4.2
- Database: PostgreSQL 15

**Logs:**
```
Traceback (most recent call last):
  File "apps/orders/views.py", line 45, in create_order
    ...
```

**Posible Solución:**
Agregar validación en serializer para detectar múltiples shops.
```

---

## 🎓 Recursos Adicionales

### Documentación del Proyecto
- [README.md](README.md) - Setup y overview general
- [BACKLOG.md](BACKLOG.md) - Feature backlog completo
- [SPRINT_TRACKING.md](SPRINT_TRACKING.md) - Tracking de sprints
- [TODO.md](TODO.md) - Deuda técnica
- [docs/API.md](docs/API.md) - API documentation
- [scripts/README.md](scripts/README.md) - Scripts helpers

### Herramientas
- [Task Manager CLI](scripts/task_manager.py) - Gestión de tareas
- [Conventional Commits](https://www.conventionalcommits.org/)
- [PEP 8](https://peps.python.org/pep-0008/) - Python style guide
- [Django Best Practices](https://docs.djangoproject.com/en/4.2/misc/design-philosophies/)

### Comunidad
- GitHub Discussions - Para preguntas generales
- GitHub Issues - Para bugs y features
- Email: dev@domipyme.com

---

## 🙏 Agradecimientos

¡Gracias por contribuir a DomiPyme! Tu trabajo ayuda a pequeños comerciantes a tener presencia digital. 🚀

**Mantente actualizado:**
- ⭐ Star el repositorio
- 👀 Watch para notificaciones
- 🍴 Fork para experimentar

**Happy coding!** 💻✨
