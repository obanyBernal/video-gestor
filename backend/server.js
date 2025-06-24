const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Carpeta de disco persistente
const VIDEO_DIR = path.join(__dirname, 'videos');

// Crear carpeta si no existe
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

// Servir visor web (TV) desde visor-tv/
const base = '/tv';
app.use(`${base}/videos`, express.static(VIDEO_DIR));
app.use(`${base}/visor`, express.static(path.join(__dirname, 'visor-tv')));
app.use(`${base}/`, express.static(path.join(__dirname, 'views')));

// 📂 Obtener lista de videos
let cachedList = [];
let lastCacheTime = 0;
const CACHE_DURATION = 60000; // 60 segundos

app.get(`${base}/list`, (req, res) => {
  const now = Date.now();

  if (now - lastCacheTime < CACHE_DURATION && cachedList.length > 0) {
    return res.json(cachedList); // 🧠 Devuelve desde cache
  }

  fs.readdir(VIDEO_DIR, (err, files) => {
    if (err) return res.status(500).send('Error al listar videos');
    const mp4Files = files.filter(f => f.endsWith('.mp4'));

    cachedList = mp4Files;
    lastCacheTime = now;

    res.json(mp4Files); // 📦 Actualiza cache
  });
});


// 🎥 Servir videos con soporte de streaming
app.get('/videos/:filename', (req, res) => {
  const filePath = path.join(VIDEO_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Video no encontrado');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable');
      return;
    }

    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });

    stream.pipe(res);
  }
});

// ⬆️ Subir videos con Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VIDEO_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post(`${base}/upload`, upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('No se subió ningún archivo.');
  res.send('✅ Video subido correctamente.');
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
