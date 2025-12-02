# Sprint Tracking - DomiPyme

> Sistema de tracking para sprints y tareas completadas

---

## 📊 Resumen General

- **Versión Actual:** 1.0.0
- **Sprint Actual:** v1.1.0 - Sprint 1
- **Inicio Sprint:** 2025-12-01
- **Fin Sprint Estimado:** 2025-12-15 (2 semanas)
- **Velocidad Promedio:** TBD (primer sprint)

---

## 🏃 Sprint Actual: v1.1.0 - Sprint 1

**Objetivo:** Implementar monetización básica y mejorar UX

**Capacidad:** 10 días de desarrollo

### 📋 Tareas Seleccionadas

#### 🔥 En Progreso
*(Ninguna actualmente)*

#### ✅ Completadas
- [x] ~~Setup inicial del proyecto~~ (Sprint 0)
- [x] ~~Autenticación JWT completa~~ (Sprint 0)
- [x] ~~Reset password flow~~ (Sprint 0)
- [x] ~~CRUD Shops con permisos~~ (Sprint 0)
- [x] ~~Tests suite (30 tests)~~ (Sprint 0)
- [x] ~~CI/CD pipeline~~ (Sprint 0)
- [x] ~~Documentación API~~ (Sprint 0)
- [x] ~~Docker + Postgres setup~~ (Sprint 0)

#### 📝 Pendientes (Priorizadas)
1. **[P0] Payment Gateway Integration** (5d)
   - Stripe SDK integration
   - Payment flow backend
   - Webhook handling
   - Frontend payment form
   - Testing con tarjetas test

2. **[P1] Order Management Enhancement** (3d)
   - Estado machine para orders
   - Transiciones validadas
   - Order timeline
   - Cancel flow

3. **[P1] Real-time Notifications** (4d)
   - Django Channels setup
   - WebSocket management
   - Notification model
   - Frontend notification center

4. **[P1] Frontend Loading States** (2d)
   - Skeleton loaders
   - Button loading states
   - Progress indicators

5. **[P1] Toast Notifications** (1d)
   - Toast component
   - Success/error/warning types
   - Auto-dismiss

#### 🚫 Bloqueadas
*(Ninguna)*

### 📈 Métricas del Sprint

- **Story Points Comprometidos:** 15
- **Story Points Completados:** 0
- **Velocidad:** TBD
- **Burndown:** [Pendiente gráfica]

### 🎯 Definition of Done

Para considerar una tarea como completada debe cumplir:

- [ ] Código implementado y funcional
- [ ] Tests unitarios escritos y pasando
- [ ] Tests de integración (si aplica)
- [ ] Documentación actualizada
- [ ] Code review aprobado
- [ ] Sin errores de linting
- [ ] Merged a `dev` branch
- [ ] Probado en staging (si existe)

---

## 📚 Sprints Históricos

### Sprint 0 (Setup) - Completado ✅

**Duración:** 2025-11-20 a 2025-12-01 (2 semanas)

**Objetivo:** Establecer fundaciones del proyecto

**Completado:**
- ✅ Django + DRF setup
- ✅ React + Vite frontend
- ✅ Autenticación JWT con rotación
- ✅ Custom User model (email-based)
- ✅ CRUD Shops y Products
- ✅ Permission system
- ✅ 30 tests automatizados
- ✅ CI/CD con GitHub Actions
- ✅ Docker + docker-compose
- ✅ PostgreSQL setup
- ✅ Security hardening
- ✅ API Documentation completa
- ✅ README y guías de setup

**Métricas:**
- Tests: 30/30 passing
- Coverage: ~70%
- Velocidad: 20 story points

**Aprendizajes:**
- La configuración de permisos tomó más tiempo de lo estimado
- Tests bien estructurados desde el inicio ahorraron debugging
- Docker simplificó el onboarding

---

## 🎯 Próximos Sprints Planeados

### v1.1.0 - Sprint 2 (Tentativo)
**Inicio:** 2025-12-16  
**Fin:** 2025-12-30

**Foco:** Analytics y Reporting
- Merchant Dashboard Analytics
- Sales reports
- Inventory reports

### v1.2.0 - Sprint 1
**Inicio:** 2026-01-01  
**Fin:** 2026-01-15

**Foco:** Product Management
- Product Images
- Product Variants
- Inventory Management

---

## 📊 Velocity Tracking

| Sprint | Story Points | Completados | Velocity |
|--------|-------------|-------------|----------|
| Sprint 0 | 20 | 20 | 20 |
| Sprint 1 | 15 | - | - |

---

## 🔄 Proceso de Sprint

### Planning (Inicio de Sprint)
1. Revisar backlog y priorizar
2. Seleccionar tareas según capacidad
3. Estimar en story points
4. Asignar responsables
5. Definir objetivo del sprint

### Daily Standup (Diario)
- ¿Qué hice ayer?
- ¿Qué haré hoy?
- ¿Hay bloqueadores?

### Review (Fin de Sprint)
1. Demo de features completadas
2. Actualizar métricas
3. Marcar tareas completadas
4. Documentar lo logrado

### Retrospectiva (Fin de Sprint)
- ¿Qué funcionó bien?
- ¿Qué podemos mejorar?
- Action items para siguiente sprint

---

## 📝 Notas y Decisiones

### Decisiones Técnicas Sprint 0
- **Django 4.2+**: Por LTS y compatibilidad
- **JWT con rotación**: Mayor seguridad que tokens estáticos
- **Pytest sobre unittest**: Sintaxis más limpia y fixtures
- **Vite sobre CRA**: Build más rápido
- **PostgreSQL**: Escalabilidad y features avanzadas

### Deuda Técnica Identificada
- [ ] Refactorizar views grandes en shops app
- [ ] Implementar pagination consistente en todos los endpoints
- [ ] Mejorar error handling en frontend
- [ ] Agregar índices de DB para queries frecuentes

---

## 🎨 Plantilla para Nuevo Sprint

```markdown
### Sprint X (vX.X.X) - Status

**Duración:** YYYY-MM-DD a YYYY-MM-DD
**Objetivo:** [Descripción del objetivo principal]
**Capacidad:** X días de desarrollo

#### Tareas Comprometidas
1. [Tarea 1] (Xd) - Status
2. [Tarea 2] (Xd) - Status

#### Métricas
- Story Points Comprometidos: X
- Story Points Completados: X
- Velocidad: X

#### Aprendizajes
- [Aprendizaje 1]
- [Aprendizaje 2]
```

---

**Última actualización:** 2025-12-01  
**Actualizado por:** Development Team
