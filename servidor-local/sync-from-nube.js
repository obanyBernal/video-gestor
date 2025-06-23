// sync-from-nube.js
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const VIDEO_DIR = path.join(__dirname, 'videos');
const BASE_URL = 'https://tv.funeralesguatemala.com'; // Cambiar si usas dominio diferente

// Usa HTTP o HTTPS según la URL
function getClient(url) {
  return url.startsWith('https') ? https : http;
}

// Verifica si el archivo ya existe localmente
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Descarga un archivo de video desde la nube
function downloadFile(filename) {
  const fileUrl = `${BASE_URL}/videos/${filename}`;
  const localPath = path.join(VIDEO_DIR, filename);

  const file = fs.createWriteStream(localPath);
  const client = getClient(fileUrl);

  console.log(`⬇️  Descargando: ${filename}...`);

  client.get(fileUrl, response => {
    if (response.statusCode === 200) {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Guardado: ${filename}`);
      });
    } else {
      console.error(`❌ Error al descargar ${filename}: ${response.statusCode}`);
      fs.unlink(localPath, () => {});
    }
  }).on('error', err => {
    console.error(`❌ Error de conexión para ${filename}:`, err.message);
  });
}

// Asegúrate que la carpeta exista
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR);
}

// 1. Obtener lista de archivos de la nube
getClient(`${BASE_URL}/list`).get(`${BASE_URL}/list`, res => {
  let data = '';

  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const videos = JSON.parse(data);
      videos.forEach(file => {
        const localPath = path.join(VIDEO_DIR, file);
        if (!fileExists(localPath)) {
          downloadFile(file);
        } else {
          console.log(`🟢 Ya existe: ${file}`);
        }
      });
    } catch (e) {
      console.error('❌ Error al analizar respuesta:', e.message);
    }
  });
}).on('error', err => {
  console.error('❌ Error al obtener lista de videos:', err.message);
});

// Guardar archivo de marca de tiempo
const timestampPath = path.join(__dirname, 'videos/last_sync.txt');
fs.writeFileSync(timestampPath, new Date().toISOString());
