/**
 * Script to scaffold 600 placeholder frames into /public/sequence-main/
 * Creates clean, valid JPEG frames corresponding to Reference.md chapters.
 */
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'public', 'sequence-main');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1x1 Minimal JPEG buffer header
// Creates lightweight valid JPG frames if canvas export is not used
const minimalJpgBase64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const minimalBuffer = Buffer.from(minimalJpgBase64, 'base64');

console.log('Scaffolding sequence-main frames...');
for (let i = 1; i <= 600; i++) {
  const fileName = `frame_${String(i).padStart(4, '0')}.jpg`;
  const filePath = path.join(outputDir, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, minimalBuffer);
  }
}
console.log('Successfully prepared 600 frames in /public/sequence-main/');
