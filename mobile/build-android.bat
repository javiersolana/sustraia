@echo off
echo ════════════════════════════════════════════════
echo 🚀 BUILD ANDROID GRATIS - SUSTRAIA
echo ════════════════════════════════════════════════
echo.

cd /d "%~dp0"

echo ✓ EAS CLI instalado:
call eas --version
echo.

echo ════════════════════════════════════════════════
echo 📝 PASO 1: LOGIN EN EXPO
echo ════════════════════════════════════════════════
echo.
echo Si no tienes cuenta, créala GRATIS en:
echo https://expo.dev/signup
echo.
pause

call eas login
if errorlevel 1 (
    echo.
    echo ❌ Error en login. Verifica tu usuario y contraseña
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════
echo 📝 PASO 2: INICIALIZAR PROYECTO
echo ════════════════════════════════════════════════
echo.

call eas init --id auto
if errorlevel 1 (
    echo.
    echo ℹ️ Proyecto ya inicializado o error. Continuando...
)

echo.
echo ════════════════════════════════════════════════
echo 🏗️ PASO 3: CONSTRUIR APK
echo ════════════════════════════════════════════════
echo.
echo ⏱️ Esto tardará 15-20 minutos...
echo 📊 Verás un link para seguir el progreso
echo.
pause

call eas build --platform android --profile preview
if errorlevel 1 (
    echo.
    echo ❌ Error en build
    echo.
    echo Posibles soluciones:
    echo 1. Ejecuta: eas build --platform android --profile preview --clear-cache
    echo 2. Verifica que no haya errores en el código
    echo 3. Revisa: https://expo.dev
    echo.
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════
echo ✅ BUILD COMPLETADO
echo ════════════════════════════════════════════════
echo.
echo 📱 Ahora:
echo 1. Abre el link del build en tu móvil
echo 2. Descarga el APK
echo 3. Instala en tu Android
echo.
echo 💡 Tip: También puedes ver el APK en:
echo https://expo.dev/accounts/[tu-usuario]/projects/sustraia-mobile/builds
echo.
pause
