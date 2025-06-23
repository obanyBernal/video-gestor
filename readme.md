# 🎥 Sistema de Gestión de Video - Funerales Guatemala

Este proyecto permite gestionar de forma centralizada los videos que se reproducen en pantallas Android TV dentro de las instalaciones de Funerales Guatemala.

## 🧱 Componentes del sistema

### 1. Visor Web para Pantallas
- Ubicado en `/visor-tv/index.html`
- Compatible con Android TV mediante navegador
- Reproduce automáticamente todos los videos disponibles en bucle
- Soporta reproducción desde servidor en la nube o local (fallback manual)

### 2. Panel de Administración Web
- Ubicado en `/views/index.html`
- Permite subir archivos `.mp4` al servidor
- Muestra la lista de videos ya disponibles
- Próximamente permitirá agregar mensajes, overlays y audios

### 3. Backend Express
- Archivo principal: `server.js`
- Framework: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- Soporta:
  - Subida de videos (vía `POST /upload`)
  - Listado de videos (`GET /list`)
  - Reproducción individual (`GET /videos/:filename`)

## ☁️ Despliegue en Render.com

### Requisitos:
- Cuenta en [Render.com](https://render.com)
- Repositorio GitHub con este proyecto
- Activar "Persistent Disk" al crear el servicio (mínimo 1 GB)

### Instrucciones:
1. Crear nuevo servicio web en Render
2. Usar este repo como fuente (GitHub)
3. Configurar:
   - **Build Command**: *(vacío o `npm install`)*
   - **Start Command**: `npm start`
   - **Root Directory**: *(vacío si `server.js` está en la raíz)*
4. Habilitar “Persistent Disk” y montarlo en: `/mnt/data`

## 📁 Estructura de carpetas

