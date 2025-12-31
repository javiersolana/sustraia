# Imágenes RAX Landing Page

## 📸 Ubicación de Imágenes

Coloca las imágenes en esta carpeta (`public/images/`) con los siguientes nombres:

### 1. **Logo RAX**
- **Nombre archivo:** `logo-rax.jpg`
- **Ubicaciones donde se usa:**
  - Navbar (esquina superior izquierda)
  - Footer (abajo izquierda)
- **Especificaciones:**
  - Formato: JPG o PNG
  - Tamaño recomendado: 200x200px mínimo
  - Aspecto: Cuadrado
  - Fondo: Transparente o que funcione en círculo

### 2. **Imagen Hero (Corredor Principal)**
- **Nombre archivo:** `hero-runner.jpg`
- **Ubicación:** Hero section (parte derecha de la pantalla principal)
- **Especificaciones:**
  - Formato: JPG
  - Tamaño recomendado: 1200x1600px (vertical)
  - Aspecto: 3:4 (vertical)
  - Contenido: Atleta/corredor en acción, fondo neutro o deportivo
  - Calidad: Alta resolución

### 3. **Foto Jonander Garcia**
- **Nombre archivo:** `jonander-garcia.jpg`
- **Ubicación:** Sección Expertos (primera tarjeta)
- **Especificaciones:**
  - Formato: JPG
  - Tamaño recomendado: 800x1000px
  - Aspecto: Vertical/Cuadrado
  - Contenido: Foto profesional de Jonander
  - Calidad: Alta resolución
  - Preferible: Fondo neutro o deportivo

### 4. **Foto Unai Gazpio**
- **Nombre archivo:** `unai-gazpio.jpg`
- **Ubicación:** Sección Expertos (segunda tarjeta)
- **Especificaciones:**
  - Formato: JPG
  - Tamaño recomendado: 800x1000px
  - Aspecto: Vertical/Cuadrado
  - Contenido: Foto profesional de Unai
  - Calidad: Alta resolución
  - Preferible: Fondo neutro o deportivo

## 📁 Estructura Final

```
public/
└── images/
    ├── logo-rax.jpg          (Logo RAX - 200x200px)
    ├── hero-runner.jpg       (Hero principal - 1200x1600px)
    ├── jonander-garcia.jpg   (Coach 1 - 800x1000px)
    └── unai-gazpio.jpg       (Coach 2 - 800x1000px)
```

## ⚠️ Importante

- **NO cambies los nombres de archivo** - deben ser exactamente como se indica arriba
- Usa **letras minúsculas** y **guiones** (no espacios)
- Formatos aceptados: JPG, PNG
- Optimiza las imágenes antes de subirlas (compresión sin pérdida de calidad)

## 🔄 Después de Añadir las Imágenes

1. Coloca todas las imágenes en `public/images/`
2. Haz commit: `git add public/images/ && git commit -m "feat: add RAX images"`
3. Push: `git push`
4. Vercel se actualizará automáticamente
