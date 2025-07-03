const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Carpeta base de videos
const VIDEO_DIR = path.join(__dirname, 'videos');

// Crear carpeta si no existe
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

// ✅ Rutas estáticas
const base = '/tv';
app.use(`${base}/visor`, express.static(path.join(__dirname, 'visor-tv')));
app.use(`${base}/`, express.static(path.join(__dirname, 'views')));

// 📂 API: Obtener lista de videos por pantalla
app.get(`${base}/list/:pantalla`, (req, res) => {
  const pantalla = req.params.pantalla;
  const pantallaDir = path.join(VIDEO_DIR, pantalla);

  fs.readdir(pantallaDir, (err, files) => {
    if (err) return res.status(500).json([]);
    const mp4Files = files.filter(f => f.endsWith('.mp4'));
    res.json(mp4Files);
  });
});


// ⬆️ Subida de videos a la raíz general (no a pantalla específica)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VIDEO_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post(`${base}/upload`, upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('No se subió ningún archivo.');
  res.send('✅ Video subido correctamente.');
});

// 🎥 Streaming de videos desde subcarpetas: pantalla1, pantalla2, etc.
app.get('/tv/videos/:pantalla/:filename', (req, res) => {
  const { pantalla, filename } = req.params;
  const filePath = path.join(VIDEO_DIR, pantalla, filename);

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
// 🐞 Ruta de depuración para listar videos detectados
app.get('/tv/debug', (req, res) => {
  const resultados = {};
  const carpetas = ['pantalla1', 'pantalla2'];

  carpetas.forEach((pantalla) => {
    const dir = path.join(__dirname, 'videos', pantalla);
    try {
      const archivos = fs.readdirSync(dir).filter(f => f.endsWith('.mp4'));
      resultados[pantalla] = archivos;
    } catch (err) {
      resultados[pantalla] = `❌ Error: ${err.message}`;
    }
  });

  res.json(resultados);
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
