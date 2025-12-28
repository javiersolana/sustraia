# Puntos de Control Automáticos

## Antes de Cambios Grandes
- Ejecutar: git status
- Verificar: branch actual
- Confirmar: tests pasan

## Durante Desarrollo
- Checkpoint cada 3+ archivos modificados
- Checkpoint antes de refactors mayores
- Checkpoint antes de cambios de arquitectura

## Después de Cambios
- Run: npm run test
- Run: npm run typecheck
- Review: git diff
- Verify: build exitoso
- Commit con mensaje clear
