# 📧 Configuración de Email con Resend

## Problema Común: Emails no llegan

Si el formulario de contacto muestra "éxito" pero los emails no llegan, probablemente es por **restricciones del plan gratuito de Resend**.

## ⚠️ Restricciones de Resend (Plan Gratuito)

### 1. Dominio `onboarding@resend.dev`
- **Solo puede enviar a emails verificados en tu cuenta de Resend**
- Esto es una medida anti-spam de Resend

### 2. Solución Rápida (Testing)
Para recibir emails en `lauretajon@gmail.com` y `javierrsolanaa@gmail.com`:

1. Ve a tu [Dashboard de Resend](https://resend.com/emails)
2. Click en **"Verified Emails"** o **"Audience"**
3. Añade ambos emails:
   - `lauretajon@gmail.com`
   - `javierrsolanaa@gmail.com`
4. Confirma los emails desde la bandeja de entrada de cada uno

### 3. Solución Permanente (Producción)
Para enviar a cualquier email sin restricciones:

#### Opción A: Verificar tu dominio propio
1. En Resend, ve a **"Domains"**
2. Añade tu dominio (ej: `sustraia.com`)
3. Configura los registros DNS (SPF, DKIM, DMARC)
4. Espera verificación (puede tardar hasta 72h)
5. Actualiza `EMAIL_FROM` en Render:
   ```
   EMAIL_FROM=SUSTRAIA <noreply@sustraia.com>
   ```

#### Opción B: Actualizar plan de Resend
- El plan de pago elimina la restricción de emails verificados
- Cuesta aprox $20/mes

## 🔍 Verificar que Resend está configurado

### En Render (Variables de entorno)
Asegúrate de tener en tu servicio de Render:

```env
RESEND_API_KEY=re_tu_api_key_aqui
EMAIL_FROM=SUSTRAIA <onboarding@resend.dev>
ADMIN_CONTACT_EMAIL=lauretajon@gmail.com,javierrsolanaa@gmail.com
```

### Logs del servidor
Cuando envías el formulario, deberías ver en los logs de Render:

✅ **Si funciona:**
```
✅ Resend email service initialized
📧 Contact form submitted: [nombre] ([email]) from [localidad]
📧 [Resend] Email sent successfully to lauretajon@gmail.com, javierrsolanaa@gmail.com
📧 [Resend] Subject: 🎯 Nuevo lead: [nombre] - [localidad]
📧 [Resend] Result: { id: '...' }
```

❌ **Si falla:**
```
❌ Resend failed with error:
Error details: { message: "Email not verified", ... }
```

## 🚀 Deployment

Después de hacer cambios en el código:

```bash
git add server/services/emailService.ts
git commit -m "fix: improve email sending to multiple recipients with better logging"
git push
```

Render detectará el push y hará deploy automáticamente.

## 📝 Testing Local

Si quieres probar localmente:

1. Crea un archivo `.env` en la raíz:
```env
RESEND_API_KEY=re_tu_api_key_aqui
EMAIL_FROM=SUSTRAIA <onboarding@resend.dev>
ADMIN_CONTACT_EMAIL=lauretajon@gmail.com,javierrsolanaa@gmail.com
```

2. Instala dependencias:
```bash
npm install
```

3. Ejecuta el servidor:
```bash
npm run server
```

4. Prueba el formulario en http://localhost:5173/contacto

## 🔧 Troubleshooting

### Los emails siguen sin llegar
1. Verifica los logs en Render Dashboard → tu servicio → "Logs"
2. Busca líneas con `[Resend]` o `❌`
3. Si ves "Email not verified":
   - Añade los emails en Resend como "Verified Emails"
   - O verifica tu dominio completo

### Error: "Invalid API key"
- Verifica que `RESEND_API_KEY` esté configurado en Render
- La key debe empezar con `re_`
- Copia la key directamente desde Resend Dashboard

### El formulario no envía nada
- Verifica que el backend esté corriendo en Render
- Comprueba que `VITE_API_URL` en el frontend apunte a tu backend de Render
- Revisa la consola del navegador (F12) para errores de CORS

## 📚 Recursos

- [Resend Docs](https://resend.com/docs)
- [Verificar emails en Resend](https://resend.com/docs/dashboard/emails/verify-email)
- [Verificar dominios en Resend](https://resend.com/docs/dashboard/domains/introduction)
