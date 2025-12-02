# Scripts de Gestión - DomiPyme

Herramientas de línea de comandos para facilitar la gestión del proyecto.

## 📋 Task Manager

Script interactivo para gestionar tareas, sprints y métricas del proyecto.

### Uso

**Desde el directorio raíz del proyecto:**

```bash
# Linux/Mac
python3 scripts/task_manager.py

# Windows
python scripts\task_manager.py
```

### Características

1. **Ver resumen del sprint actual**
   - Fechas, objetivos y capacidad
   - Tareas priorizadas
   - Estado general

2. **Listar tareas pendientes**
   - Top 10 tareas por prioridad
   - Organizadas por P0, P1, P2
   - Estimaciones de tiempo

3. **Buscar en backlog**
   - Búsqueda de texto completo
   - Muestra hasta 20 resultados
   - Con número de línea para referencia

4. **Ver métricas del proyecto**
   - Tests y coverage
   - Velocity del equipo
   - Estado de calidad
   - Tamaño del backlog

5. **Agregar nota al sprint**
   - Timestamped
   - Se guarda en SPRINT_TRACKING.md
   - Útil para decisiones y bloqueadores

6. **Ver categorías del backlog**
   - 15 categorías principales
   - Contador de tareas por categoría
   - Vista rápida de distribución

7. **Ver deuda técnica**
   - Identificación de refactors pendientes
   - Priorización por impacto
   - Ubicación en el código

### Ejemplos

```bash
# Ejecutar el script
python scripts/task_manager.py

# Opción 1: Ver sprint actual
# Muestra: Fechas, objetivos, tareas priorizadas

# Opción 3: Buscar "payment"
# Encuentra todas las tareas relacionadas con pagos

# Opción 5: Agregar nota
# "Implementado Stripe webhook, pendiente testing"
```

### Requisitos

- Python 3.7+
- Archivos `BACKLOG.md` y `SPRINT_TRACKING.md` en el directorio raíz

### Tips de Uso

- 🎯 Revisa el sprint summary antes de comenzar el día
- 🔍 Usa la búsqueda para encontrar tareas relacionadas rápidamente
- 📝 Agrega notas cuando tomes decisiones importantes
- 📊 Revisa métricas semanalmente para ajustar velocity

### Personalización

El script puede extenderse para:
- Marcar tareas como completadas
- Crear nuevas tareas desde terminal
- Generar reportes HTML
- Integración con GitHub Issues
- Notificaciones de deadlines

---

## 🧪 Test Runner

Script para ejecutar tests selectivamente con reportes visuales y CI pipeline completo.

### Uso

**Modo Interactivo:**
```bash
python scripts/test_runner.py
```

**Modo Rápido (CLI):**
```bash
# Ejecutar todos los tests
python scripts/test_runner.py all

# Tests con coverage
python scripts/test_runner.py coverage

# Tests rápidos (sin coverage)
python scripts/test_runner.py fast

# Linting (Black + flake8)
python scripts/test_runner.py lint

# Security check
python scripts/test_runner.py security

# Full CI pipeline
python scripts/test_runner.py ci
```

### Características

1. **Ejecutar todos los tests** - Test suite completo
2. **Tests por categoría** - accounts, shops, products
3. **Coverage reports** - HTML y terminal
4. **Tests rápidos** - Sin coverage para desarrollo
5. **Linting** - Black + flake8
6. **Security check** - Safety para vulnerabilidades
7. **Full CI pipeline** - Lint + tests + security

### Output Ejemplo

```bash
$ python scripts/test_runner.py ci

==============================================
         Full CI Pipeline
==============================================

[1/3] Linting
ℹ Ejecutando: Black
✓ Black completado en 1.23s
ℹ Ejecutando: Flake8
✓ Flake8 completado en 0.87s

[2/3] Tests
ℹ Ejecutando: Test suite
✓ Test suite completado en 5.43s

[3/3] Security
ℹ Ejecutando: Security check
✓ Security check completado en 2.10s

==============================================
         Resumen de CI Pipeline
==============================================

  Linting              ✓ PASS
  Tests                ✓ PASS
  Security             ✓ PASS

✓ 🎉 Pipeline completado exitosamente!
ℹ ✓ El código está listo para commit/PR
```

### Pre-commit Hook

Agrega el test runner a tus pre-commit hooks:

```bash
# .git/hooks/pre-commit
#!/bin/bash
python scripts/test_runner.py ci
if [ $? -ne 0 ]; then
    echo "❌ Tests fallaron. Commit cancelado."
    exit 1
fi
```

---

## 🔜 Futuros Scripts

### Database Manager
```bash
python scripts/db_manager.py
# - Backup/restore
# - Migrations helper
# - Seed data
```

### Deploy Helper
```bash
python scripts/deploy.py
# - Pre-deploy checklist
# - Environment validation
# - Post-deploy verification
```

---

## 🔍 Setup Checker

Script para verificar que el ambiente de desarrollo esté correctamente configurado.

### Uso

```bash
python scripts/setup_check.py
```

### Verificaciones

El script verifica:

**Backend:**
- ✓ Python instalado (versión)
- ✓ manage.py existe
- ✓ requirements.txt existe
- ✓ .env configurado
- ✓ Base de datos creada
- ✓ Virtual environment
- ✓ Django instalado
- ✓ Django REST Framework

**Frontend:**
- ✓ Node.js instalado (versión)
- ✓ package.json existe
- ✓ node_modules instalado
- ✓ Vite configurado
- ✓ src/ directory
- ✓ npm disponible

**Docker:**
- ✓ Docker instalado
- ✓ docker-compose instalado
- ✓ docker-compose.yml existe
- ✓ Dockerfile existe

**Git:**
- ✓ Git instalado
- ✓ .git directory
- ✓ .gitignore configurado
- ✓ Remote configurado

**Documentation:**
- ✓ README.md
- ✓ BACKLOG.md
- ✓ SPRINT_TRACKING.md
- ✓ TODO.md
- ✓ CONTRIBUTING.md
- ✓ PROGRESS.md

**Scripts:**
- ✓ task_manager.py
- ✓ test_runner.py
- ✓ setup_check.py

**Tests:**
- ✓ Test directories
- ✓ pytest instalado
- ✓ pytest.ini configurado

### Output Ejemplo

```bash
$ python scripts/setup_check.py

======================================================================
                        DomiPyme Setup Checker
======================================================================

Checking your development environment...

======================================================================
                            Backend Setup
======================================================================

✓ Python installed                       Python 3.11.5
✓ manage.py exists
✓ requirements.txt exists
✓ .env file exists
✓ db.sqlite3 exists
✓ Virtual environment
✓ Django installed                       v4.2.7
✓ Django REST Framework

======================================================================
                           Frontend Setup
======================================================================

✓ Node.js installed                      v20.10.0
✓ package.json exists
✓ node_modules exists
✓ vite.config.js exists
✓ src/ directory
✓ npm installed                          v10.2.3

======================================================================
                             Summary
======================================================================

✓ Backend
✓ Frontend
✓ Docker
✓ Git
✓ Documentation
✓ Scripts
✓ Tests

🎉 Perfect! All checks passed (100%)
Your development environment is fully configured!

For setup instructions, see: README.md
For contribution guide, see: CONTRIBUTING.md
```

### Uso Recomendado

**Después de clonar el proyecto:**
```bash
python scripts/setup_check.py
```

**Antes de comenzar a desarrollar:**
```bash
python scripts/setup_check.py
```

**Para onboarding de nuevos desarrolladores:**
```bash
python scripts/setup_check.py
```

---

## 📚 Documentación Relacionada

- [BACKLOG.md](../BACKLOG.md) - Feature backlog completo
- [SPRINT_TRACKING.md](../SPRINT_TRACKING.md) - Tracking de sprints
- [TODO.md](../TODO.md) - Tareas técnicas inmediatas
- [README.md](../README.md) - Documentación general
