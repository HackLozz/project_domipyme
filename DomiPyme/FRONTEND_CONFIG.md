# Guía de Configuración y Solución de Errores - DomiPyme Frontend

## 🔧 Errores Corregidos

### 1. Error de Importación de API
**Problema:** Los componentes estaban importando `API` (mayúscula) cuando el export es `api` (minúscula).

**Archivos Corregidos:**
- `src/context/CartContext.jsx` ✅
- `src/components/ReviewForm.jsx` ✅
- `src/components/ReviewList.jsx` ✅
- `src/pages/Cart.jsx` ✅
- `src/components/CartIcon.jsx` ✅

**Antes:**
```javascript
import API from './Api';
await API.get('/api/cart/');
```

**Después:**
```javascript
import api from './Api';
await api.get('/api/cart/');
```

### 2. Hook useCart Faltante
**Problema:** Los componentes intentaban usar `useCart()` pero el hook no existía.

**Solución:** Se agregó el hook personalizado al final de `CartContext.jsx`:
```javascript
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
```

### 3. Estilos CSS Faltantes para CartIcon
**Problema:** El componente CartIcon no tenía estilos definidos.

**Solución:** Se agregaron los siguientes estilos en `styles.css`:
- `.cart-icon-link`
- `.cart-icon-container`
- `.cart-icon`
- `.cart-badge`

## 💳 Configuración de Stripe

### Paso 1: Obtener Claves de Stripe

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Crea una cuenta o inicia sesión
3. Activa el modo "Test" (esquina superior izquierda)
4. Ve a **Developers > API keys**
5. Copia las siguientes claves:
   - **Publishable key** (empieza con `pk_test_`)
   - **Secret key** (empieza con `sk_test_`)

### Paso 2: Configurar Frontend

El archivo `.env` ya está creado en `frontend/.env` con una clave de ejemplo:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51QRPuY04AzdOh9BhqBWGOC4sXQWYDRfKGJEYT8kfUdO0vqpzN8YJ9rKqLmJNhgZx7Y3wX2vZ1aB4cD5eF6gH7iJ00k8lM9nO0
```

**IMPORTANTE:** Reemplaza esta clave con tu propia clave de Stripe (Publishable key).

### Paso 3: Configurar Backend

Crea o edita el archivo `.env` en la carpeta `backend/`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_PUBLICABLE_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_AQUI
```

### Paso 4: Configurar Webhook (Opcional para Desarrollo)

Para recibir notificaciones de pago:

1. Instala Stripe CLI: https://stripe.com/docs/stripe-cli
2. Ejecuta en terminal:
   ```bash
   stripe login
   stripe listen --forward-to localhost:8000/api/payments/webhook/stripe/
   ```
3. Copia el webhook secret que aparece (empieza con `whsec_`)
4. Agrégalo al `.env` del backend

## 🚀 Reiniciar el Servidor de Desarrollo

Después de hacer cambios en `.env`, reinicia el servidor:

### Frontend:
```bash
cd frontend
npm run dev
```

### Backend:
```bash
cd backend
python manage.py runserver
```

## 🧪 Probar Pagos con Stripe Test Mode

Usa estas tarjetas de prueba:

- **Pago Exitoso:** `4242 4242 4242 4242`
- **Pago Rechazado:** `4000 0000 0000 0002`
- **Requiere Autenticación:** `4000 0027 6000 3184`

**Datos adicionales:**
- CVC: Cualquier 3 dígitos (ej: `123`)
- Fecha de expiración: Cualquier fecha futura (ej: `12/25`)
- Código postal: Cualquier 5 dígitos (ej: `12345`)

## 📝 Estructura de Archivos Modificados

```
frontend/
├── .env                          # ✅ Nuevo - Configuración de Stripe
├── .env.example                  # ✅ Nuevo - Ejemplo de configuración
├── src/
│   ├── config/
│   │   └── stripe.js            # ✅ Nuevo - Configuración de Stripe
│   ├── components/
│   │   ├── CartIcon.jsx         # ✅ Actualizado - useCart hook
│   │   ├── ReviewForm.jsx       # ✅ Corregido - import api
│   │   ├── ReviewList.jsx       # ✅ Corregido - import api
│   │   ├── StarRating.jsx       # ✅ Nuevo
│   │   └── StripeCheckoutForm.jsx # ✅ Nuevo
│   ├── context/
│   │   └── CartContext.jsx      # ✅ Corregido - import api + useCart hook
│   ├── pages/
│   │   ├── Cart.jsx             # ✅ Actualizado - useCart hook
│   │   └── Checkout.jsx         # ✅ Reemplazado - Stripe integration
│   └── styles.css               # ✅ Actualizado - Estilos para cart, reviews, checkout

backend/
└── .env                          # ⚠️ Crear - Configuración de Stripe
```

## ❗ Errores Comunes y Soluciones

### Error: "useCart must be used within a CartProvider"
**Causa:** El componente no está envuelto en `<CartProvider>`.
**Solución:** Verifica que `main.jsx` tenga la estructura correcta:
```jsx
<AuthProvider>
  <CartProvider>
    <App />
  </CartProvider>
</AuthProvider>
```

### Error: "API is not defined"
**Causa:** Importación incorrecta de api.
**Solución:** Usa `import api from './Api'` (minúscula).

### Error: "Invalid Stripe publishable key"
**Causa:** La clave de Stripe no es válida o está mal configurada.
**Solución:** 
1. Verifica que la clave en `.env` empiece con `pk_test_`
2. Reinicia el servidor de desarrollo
3. Limpia la caché del navegador

### Página en Blanco
**Causas posibles:**
1. Error de importación → Revisa la consola del navegador (F12)
2. Context Provider faltante → Verifica `main.jsx`
3. Error en API → Verifica que el backend esté corriendo
4. Variable de entorno no cargada → Reinicia el servidor

**Solución rápida:**
```bash
# 1. Detener servidores
Ctrl + C

# 2. Limpiar y reinstalar
cd frontend
rm -rf node_modules .vite
npm install

# 3. Reiniciar
npm run dev
```

## 🔍 Verificación de Estado

Para verificar que todo está funcionando:

1. **Frontend cargando:**
   - Abre http://localhost:5173
   - No debe haber página en blanco
   - Revisa consola del navegador (F12) - no debe haber errores rojos

2. **CartContext funcionando:**
   - El ícono del carrito debe aparecer en el navbar
   - Debe mostrar el número de ítems si hay productos

3. **Stripe configurado:**
   - Ve a /checkout
   - Debe cargar el formulario de pago
   - Debe mostrar el campo de tarjeta de Stripe

## 📞 Recursos Adicionales

- **Documentación de Stripe:** https://stripe.com/docs/stripe-js
- **Tarjetas de prueba:** https://stripe.com/docs/testing
- **Stripe Dashboard:** https://dashboard.stripe.com
- **React Stripe.js:** https://stripe.com/docs/stripe-js/react

## ✅ Checklist Final

Antes de continuar, verifica:

- [ ] Archivo `.env` en frontend con `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] Archivo `.env` en backend con `STRIPE_SECRET_KEY`
- [ ] Servidor frontend corriendo (`npm run dev`)
- [ ] Servidor backend corriendo (`python manage.py runserver`)
- [ ] No hay errores en consola del navegador (F12)
- [ ] CartIcon aparece en navbar
- [ ] Página /cart carga correctamente
- [ ] Página /checkout carga el formulario de Stripe

---

**Última actualización:** 3 de diciembre de 2025
**Versión:** 1.0.0
