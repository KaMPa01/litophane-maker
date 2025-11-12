const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Carpeta de uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// Configuración de multer: guardar en disco
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, safeName);
  },
});
const upload = multer({ storage });

// Endpoint para recibir imagen + textura
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    const texture = req.body.texture;
    const filePath = req.file?.path;

    if (!filePath || !texture) {
      return res.status(400).json({ error: 'Faltan datos: imagen o textura' });
    }

    console.log('Imagen recibida:', req.file.originalname, '->', filePath);
    console.log('Textura seleccionada:', texture);

    // Traer la textura (asumimos URL pública)
    const textureResp = await fetch(texture);
    if (!textureResp.ok) return res.status(400).json({ error: 'No se pudo descargar la textura' });
    const textureArrayBuffer = await textureResp.arrayBuffer();
    const textureBuffer = Buffer.from(textureArrayBuffer);

    // Determinar modo de mezcla (blend). Aceptar valores seguros y mapear 'color-*' a 'colour-*' si es necesario.
    const requestedBlend = (req.body.blend || 'overlay').toString().toLowerCase();
    const blendMap = {
      'color-dodge': 'colour-dodge',
      'color-burn': 'colour-burn',
    };
    let blend = blendMap[requestedBlend] || requestedBlend;
    const allowed = new Set([
      'overlay',
      'multiply',
      'screen',
      'soft-light',
      'hard-light',
      'darken',
      'lighten',
      'difference',
      'exclusion',
      'colour-dodge',
      'colour-burn',
    ]);
    if (!allowed.has(blend)) blend = 'overlay';

    // Componer la textura sobre la imagen usando sharp
    const combinedName = 'combined-' + Date.now() + '.png';
    const combinedPath = path.join(uploadDir, combinedName);

    await sharp(filePath)
      .composite([{ input: textureBuffer, gravity: 'center', blend }])
      .toFile(combinedPath);

    // Simular generación de STL (archivo fake)
    const stlName = 'model-' + Date.now() + '.stl';
    const stlPath = path.join(uploadDir, stlName);
    fs.writeFileSync(stlPath, 'solid fake\nendsolid fake\n');

    // Responder con rutas públicas
    const baseUrl = '';
    res.json({
      message: 'Procesado correctamente',
      imageUrl: `/uploads/${path.basename(filePath)}`,
      combinedUrl: `/uploads/${combinedName}`,
      stlUrl: `/uploads/${stlName}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.listen(port, () => {
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});

module.exports = app;
