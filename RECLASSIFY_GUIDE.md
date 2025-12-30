# 🔄 Guía de Reclasificación de Entrenamientos

## Problema Resuelto

**Bug encontrado:** El clasificador SÍ se ejecutaba, pero había una variable duplicada que sobreescribía los datos antes de guardar.

**Línea problemática (stravaService.ts:346):**
```typescript
// ❌ ANTES: Variable duplicada
const detailedActivity = await getDetailedActivity(userId, activity.id);
classification = intelligentClassify(detailedActivity);

// Bug: sobrescribe la variable
const detailedActivity = classification ? await getDetailedActivity(...) : null;
```

**Solución aplicada:**
```typescript
// ✅ AHORA: Variable declarada una sola vez
let detailedActivity: StravaDetailedActivity | null = null;
detailedActivity = await getDetailedActivity(userId, activity.id);
classification = intelligentClassify(detailedActivity);

// Ya no hay segunda llamada innecesaria
```

---

## Logging Añadido

Ahora cada sincronización muestra:
```
🔍 Clasificando actividad: Rodaje matutino
📊 Splits disponibles: 12
🏁 Laps disponibles: 0
✅ Clasificación: RODAJE
📝 Descripción: Rodaje de 12.3km a ritmo moderado
🎯 Confidence: high
```

---

## Métodos de Reclasificación

### 1. API Endpoint (Recomendado para usuarios)

**Endpoint:** `POST /api/strava/reclassify`

**Autenticación:** Requiere token JWT

**Uso con curl:**
```bash
curl -X POST http://localhost:3000/api/strava/reclassify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Respuesta:**
```json
{
  "success": true,
  "reclassified": 18,
  "failed": 2,
  "total": 20,
  "results": [
    {
      "id": "cm7abc123",
      "title": "Rodaje matutino",
      "type": "RODAJE",
      "description": "Rodaje de 12.3km a ritmo moderado",
      "confidence": "high"
    },
    {
      "id": "cm7def456",
      "title": "Series en pista",
      "type": "SERIES",
      "description": "8x400m @ 1:25/400m con 90s descanso",
      "confidence": "high"
    }
  ]
}
```

**Uso desde frontend:**
```typescript
const response = await api.strava.reclassify();
console.log(`Reclasificadas: ${response.reclassified} actividades`);
```

---

### 2. Script de línea de comandos

**Archivo:** `server/scripts/reclassifyWorkouts.ts`

**Uso:**
```bash
# Reclasificar todos los usuarios
npx ts-node server/scripts/reclassifyWorkouts.ts

# Reclasificar solo un usuario específico
npx ts-node server/scripts/reclassifyWorkouts.ts cm6abc123xyz
```

**Salida:**
```
🔄 Starting reclassification process...

📋 Found 20 workouts to reclassify

🔍 Processing: Rodaje matutino
   Date: 12/28/2025
   User: Juan Pérez (juan@example.com)
   Strava ID: 123456789
   📊 Splits: 12
   🏁 Laps: 0
   ✅ Classified as: RODAJE
   📝 Description: Rodaje de 12.3km a ritmo moderado
   🎯 Confidence: high
   💾 Saved to database

...

============================================================

🎉 Reclassification complete!
   ✅ Success: 18
   ❌ Failed: 2
   📊 Total: 20
```

---

## Nuevas Actividades

Desde ahora, **todas las actividades nuevas** sincronizadas desde Strava:
1. ✅ Obtienen datos detallados (splits + laps)
2. ✅ Se clasifican automáticamente
3. ✅ Guardan estructura completa en `workoutStructure`
4. ✅ Tienen `humanReadable` y `classificationConfidence`

**No necesitas hacer nada** - funciona automáticamente.

---

## Verificar en Prisma Studio

1. Abre Prisma Studio:
```bash
npx prisma studio
```

2. Ve a tabla `CompletedWorkout`

3. Busca una actividad y verifica:
```json
{
  "label": "SERIES",
  "humanReadable": "8x400m @ 1:25/400m con 90s descanso",
  "classificationConfidence": "high",
  "workoutStructure": {
    "classification": {
      "warmup": { "distance": 1500, "duration": 420 },
      "main": [
        {
          "type": "interval",
          "reps": 8,
          "distance": 400,
          "pace": 85,
          "rest": 90
        }
      ],
      "cooldown": { "distance": 1000, "duration": 360 }
    },
    "rawData": {
      "splits": [...],
      "laps": [...],
      "elevation": 45
    }
  }
}
```

---

## Probar con Nueva Actividad

1. Ve a Strava y crea/sube una actividad

2. En la app, haz clic en "Sincronizar Strava"

3. Mira los logs del servidor:
```
🔍 Clasificando actividad: Tu entreno
📊 Splits disponibles: 8
🏁 Laps disponibles: 2
✅ Clasificación: TEMPO
📝 Descripción: Tempo run de 8km a 4:15/km
🎯 Confidence: high
```

4. Verifica en el dashboard que aparece con la descripción correcta

5. Haz clic en la actividad → deberías ver las pestañas:
   - ✅ Resumen
   - ✅ Vueltas (si tiene laps)
   - ✅ Splits (si tiene splits)
   - ✅ Gráficas

---

## Troubleshooting

### "No splits ni laps disponibles"
- Verifica que la actividad en Strava tenga GPS activado
- Actividades manuales no tienen splits automáticos
- Laps solo aparecen si los marcaste durante el entreno

### "Error al clasificar"
- Chequea que el token de Strava no haya expirado
- Verifica que tienes permiso `activity:read_all` en Strava
- Revisa los logs del servidor para detalles

### "workoutStructure sigue siendo null"
- Si es una actividad antigua, debes reclasificarla manualmente
- Si es nueva, revisa que no haya errores en los logs al sincronizar

---

## Próximos Pasos

1. ✅ Ejecuta reclasificación para actividades antiguas
2. ✅ Verifica que nuevas sincronizaciones funcionan
3. ✅ Comprueba que ActivityAnalysis muestra los tabs correctos
4. ✅ Disfruta de descripciones inteligentes como "8x400m @ 1:25/400m"

**Todo listo para producción** 🚀
