// backend/server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Carpeta de disco persistente en Render
const VIDEO_DIR = path.join(__dirname, 'videos');

// Crear carpeta si no existe
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

// Servir visor web (TV) desde visor-tv/
const base = '/tv';

// Servir archivos de video públicamente
app.use(`${base}/videos`, express.static(VIDEO_DIR));
app.use(`${base}/visor`, express.static(path.join(__dirname, 'visor-tv')));
// Servir panel de administración desde views/
app.use(`${base}/`, express.static(path.join(__dirname, 'views')));

// Ruta para obtener lista de videos
app.get(`${base}/list`, (req, res) => {
  fs.readdir(VIDEO_DIR, (err, files) => {
    if (err) return res.status(500).send('Error al listar videos');
    const mp4Files = files.filter(f => f.endsWith('.mp4'));
    res.json(mp4Files);
  });
});

// Servir archivos de video individuales
app.get('/videos/:filename', (req, res) => {
  const filePath = path.join(VIDEO_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Video no encontrado');
  }
});

// Configurar Multer para subir videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VIDEO_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Ruta para subir un video
app.post(`${base}/upload`, upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('No se subió ningún archivo.');
  res.send('✅ Video subido correctamente.');
});


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
