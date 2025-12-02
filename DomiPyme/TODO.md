# DomiPyme - TODO List

## ✅ Completado (v1.0.0)

### Crítico - Seguridad y Estabilidad
- [x] **Reset password flow alignment** - Frontend y backend sincronizados (uidb64)
- [x] **Email HTML templates** - Plantilla responsive para reset password
- [x] **Security hardening** - Throttling (20/min anon, 120/min user), secure cookies, HSTS, XSS protection
- [x] **Structured logging** - Configuración de logs con formatters y handlers
- [x] **.env.example comprehensive** - Documentación completa de variables de entorno

### Alto - Infraestructura
- [x] **Docker-compose completion** - Postgres service con healthchecks, volumes, networks
- [x] **Database optimization** - Select_related/prefetch_related para prevenir N+1 queries
- [x] **Permissions implementation** - Custom permission classes para ownership validation

### Medio - Testing y Documentación
- [x] **Test suite expansion** - Tests para auth, shops, products, permissions, reset flow completo
- [x] **API documentation** - Documentación completa con ejemplos cURL y JSON
- [x] **CI/CD pipeline** - GitHub Actions con lint, tests, security checks, build
- [x] **README updates** - Setup completo, deployment, arquitectura, troubleshooting

### Medio - Features
- [x] **Mini-sites slug validation** - Tests para unicidad y acceso por slug
- [x] **Audit logging** - Sistema básico de audit logs para acciones críticas

---

## 🔄 En Progreso

### Alto
- [ ] **Frontend UX improvements**
  - [ ] Loading states en todos los formularios
  - [ ] Error boundaries mejorados
  - [ ] Toast notifications para feedback
  - [ ] Skeleton loaders para listas
  - [ ] Form validation visual mejorada

### Medio
- [ ] **Test coverage expansion**
  - [ ] Tests para orders app
  - [ ] Tests para payments app
  - [ ] Integration tests end-to-end
  - [ ] Alcanzar 80%+ coverage

---

## 📋 Pendiente

### Crítico
- [ ] **Payment gateway integration**
  - [ ] Integración con Stripe o PayPal
  - [ ] Webhook handling para confirmación de pagos
  - [ ] Refund handling
  - [ ] Payment status tracking

- [ ] **Production deployment checklist**
  - [ ] Configurar servidor (VPS o cloud)
  - [ ] Configurar Nginx como reverse proxy
  - [ ] SSL con Let's Encrypt
  - [ ] Backup automático de base de datos
  - [ ] Monitoring (Sentry, New Relic, o similar)

### Alto
- [ ] **Real-time notifications**
  - [ ] WebSocket setup (Django Channels)
  - [ ] Notificaciones de nuevas órdenes para merchants
  - [ ] Notificaciones de cambios de estado de órdenes para customers
  - [ ] Email notifications para eventos importantes

- [ ] **Dashboard analytics para merchants**
  - [ ] Gráficos de ventas por período
  - [ ] Top productos más vendidos
  - [ ] Métricas de inventario
  - [ ] Revenue tracking

- [ ] **Order management enhancement**
  - [ ] Estado de órdenes (pending → paid → shipped → delivered)
  - [ ] Tracking de envíos
  - [ ] Cancelación de órdenes
  - [ ] Historial de estado

- [ ] **Inventory management**
  - [ ] Stock alerts cuando productos están bajos
  - [ ] Bulk update de stock
  - [ ] Historial de cambios de inventario

### Medio
- [ ] **Search and filtering**
  - [ ] Búsqueda full-text en productos
  - [ ] Filtros avanzados (precio, categoría, disponibilidad)
  - [ ] Ordenamiento (más vendido, precio, fecha)
  - [ ] Integración con Elasticsearch (opcional)

- [ ] **Reviews and ratings system**
  - [ ] Clientes pueden dejar reviews en productos
  - [ ] Rating 1-5 estrellas
  - [ ] Moderación de reviews por merchants
  - [ ] Promedio de ratings visible en productos

- [ ] **Shop customization**
  - [ ] Logo upload para shops
  - [ ] Banner images
  - [ ] Color scheme customization
  - [ ] Custom CSS (avanzado)

- [ ] **Product management enhancement**
  - [ ] Imágenes de productos (multiple)
  - [ ] Variantes de productos (tallas, colores)
  - [ ] Descuentos y promociones
  - [ ] Productos destacados

- [ ] **Admin panel improvements**
  - [ ] Dashboard overview con stats
  - [ ] Bulk actions en admin
  - [ ] Export data (CSV, Excel)
  - [ ] Advanced filtering

### Bajo
- [ ] **Internationalization (i18n)**
  - [ ] Django translations setup
  - [ ] React i18n (react-i18next)
  - [ ] Soporte para español e inglés
  - [ ] Currency localization

- [ ] **Progressive Web App (PWA)**
  - [ ] Service worker setup
  - [ ] Offline mode básico
  - [ ] Install prompt
  - [ ] Push notifications

- [ ] **Performance optimization**
  - [ ] Redis caching layer
  - [ ] CDN para static files
  - [ ] Image optimization (WebP, lazy loading)
  - [ ] Query optimization audit

- [ ] **Celery + Redis for async tasks**
  - [ ] Email sending asíncrono
  - [ ] Report generation
  - [ ] Bulk operations
  - [ ] Scheduled tasks (cleanup, reports)

- [ ] **Social features**
  - [ ] Share products en redes sociales
  - [ ] Follow/favorite shops
  - [ ] Wishlist para customers

---

## 🐛 Bugs Conocidos

- [ ] Test endpoint namespace inconsistency en algunas apps (revisar todas las apps)
- [ ] Frontend axios interceptor puede causar bucle infinito si refresh token falla
- [ ] No hay filtro de shops activas vs inactivas en la lista pública (implementar)

---

## 🔧 Mejoras Técnicas

### Backend
- [ ] Refactorizar views largas a ViewSets consistentes
- [ ] Implementar pagination uniforme en todos los endpoints
- [ ] Agregar versioning a la API (v1, v2)
- [ ] Implementar GraphQL (opcional)
- [ ] Mejorar exception handling con custom exceptions
- [ ] Agregar API rate limiting por usuario (ya existe global)

### Frontend
- [ ] Refactorizar componentes grandes (Dashboard, AdminPanel)
- [ ] Implementar React Query para state management
- [ ] Agregar Storybook para component library
- [ ] Mejorar TypeScript adoption (migrar de JS)
- [ ] Implementar code splitting para bundles más pequeños
- [ ] Agregar PWA manifest y service worker

### DevOps
- [ ] Configurar staging environment
- [ ] Automated database backups
- [ ] Health check endpoints
- [ ] Prometheus + Grafana para monitoring
- [ ] Log aggregation (ELK stack o similar)
- [ ] Automated rollback strategy

### Testing
- [ ] E2E tests con Playwright o Cypress
- [ ] Performance testing con Locust
- [ ] Security testing automatizado
- [ ] Visual regression testing

---

## 📊 Métricas de Calidad

### Actual (v1.0.0)
- **Test Coverage:** ~60% (backend)
- **API Endpoints:** 15+ documentados
- **Security Score:** B+ (con mejoras implementadas)
- **Performance:** No medido aún

### Objetivos (v1.5.0)
- **Test Coverage:** 80%+
- **API Response Time:** <200ms (p95)
- **Security Score:** A
- **Uptime:** 99.5%

---

## 🗓️ Roadmap

### v1.1.0 (Próximo mes)
- Payment gateway integration
- Real-time notifications
- Dashboard analytics básico
- Frontend UX improvements

### v1.2.0 (2 meses)
- Order management enhancement
- Inventory management
- Reviews and ratings
- Search and filtering

### v1.3.0 (3 meses)
- Shop customization
- Product images y variantes
- Admin panel improvements
- Performance optimization

### v1.5.0 (4-6 meses)
- Internationalization
- PWA features
- Advanced analytics
- Celery + Redis async tasks

### v2.0.0 (6+ meses)
- GraphQL API
- Microservices architecture
- Multi-vendor marketplace features
- AI-powered recommendations

---

## 📝 Notas

- Priorizar features basándose en feedback de usuarios beta
- Mantener documentación actualizada con cada release
- Revisar y actualizar dependencies mensualmente
- Realizar security audits trimestrales
- Backup de base de datos diario en producción

---

**Última actualización:** 2024-01-16  
**Versión actual:** 1.0.0  
**Próximo release:** v1.1.0 (estimado: 2024-02-15)
