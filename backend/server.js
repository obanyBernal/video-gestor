// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 📁 Carpeta persistente de Render
const VIDEO_DIR = '/mnt/data/videos';

// Crear la carpeta si no existe
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

// Middleware para servir visor y panel
app.use('/visor', express.static(path.join(__dirname, '../visor-tv')));
app.use('/', express.static(path.join(__dirname, 'views')));

// Servir videos individuales por nombre
app.get('/videos/:filename', (req, res) => {
  const filePath = path.join(VIDEO_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Video no encontrado');
  }
});

// Obtener lista de videos
app.get('/list', (req, res) => {
  fs.readdir(VIDEO_DIR, (err, files) => {
    if (err) return res.status(500).send('Error al listar videos.');
    const mp4s = files.filter(f => f.endsWith('.mp4'));
    res.json(mp4s);
  });
});

// Subida de videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VIDEO_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('No se subió ningún archivo.');
  res.send('✅ Video subido correctamente.');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor activo en http://localhost:${PORT}`);
});
