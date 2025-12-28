# Build Fullstack con Testing

**think ultrathink**

OBJETIVO: Implementar funcionalidad completa con tests automáticos.

RECIBE: $ARGUMENTS (descripción de la feature)

PROCESO AUTOMÁTICO:
1. **PLANNING** (ultrathink mode)
   - Analiza requisitos
   - Diseña arquitectura (frontend + backend + DB)
   - Identifica edge cases
   - Crea plan de tests

2. **TEST-FIRST** (TDD)
   - Escribe tests que fallen
   - Run tests (deben fallar)
   - Commit: "test: add failing tests for [feature]"

3. **IMPLEMENTATION**
   - Implementa código mínimo
   - Run tests
   - Si fallan → debug → fix → repeat
   - Loop hasta que TODOS los tests pasen

4. **REFINEMENT**
   - Refactoriza código
   - Optimiza performance
   - Verifica type safety
   - Run tests again

5. **DOCUMENTATION**
   - Actualiza README si necesario
   - Comenta código complejo
   - Actualiza CLAUDE.md si hay nuevos patterns

6. **COMMIT**
   - Mensaje descriptivo
   - Incluye breaking changes si aplica

REQUISITOS:
- Test coverage >80%
- Zero TypeScript errors
- Zero ESLint warnings
- Build exitoso
- Performance no degradada

AUTO-CORRECCIÓN:
Si algún paso falla, debuggea y reintenta automáticamente.
NO pidas ayuda hasta intentar 3 veces.
