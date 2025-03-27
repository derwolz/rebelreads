import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const texturesDir = path.join(__dirname, 'client', 'public', 'images', 'textures');

// Create directory if it doesn't exist
import { existsSync, createWriteStream, unlink } from 'fs';
import { mkdir } from 'fs/promises';

if (!existsSync(texturesDir)) {
  await mkdir(texturesDir, { recursive: true });
}

const textures = [
  {
    url: 'https://threejs.org/examples/textures/water/Water_1_M_Normal.jpg',
    filename: 'waterbumpmap.webp'
  },
  {
    url: 'https://threejs.org/examples/textures/planets/moon_1024.jpg',
    filename: 'FullMoon.webp'
  }
];

const downloadTexture = async (texture) => {
  const filePath = path.join(texturesDir, texture.filename);
  const file = createWriteStream(filePath);
  
  return new Promise((resolve, reject) => {
    https.get(texture.url, response => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${texture.filename}`);
        resolve();
      });
      
      file.on('error', err => {
        unlink(filePath, () => {});
        console.error(`Error downloading ${texture.filename}: ${err.message}`);
        reject(err);
      });
    }).on('error', err => {
      unlink(filePath, () => {});
      console.error(`Error downloading ${texture.filename}: ${err.message}`);
      reject(err);
    });
  });
};

// Download all textures
const downloadAll = async () => {
  try {
    await Promise.all(textures.map(downloadTexture));
    console.log('All textures downloaded successfully!');
  } catch (error) {
    console.error('Failed to download all textures:', error);
  }
};

downloadAll();