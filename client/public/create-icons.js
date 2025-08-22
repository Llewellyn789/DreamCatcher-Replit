
const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a simple dreamcatcher icon as PNG
function createDreamcatcherPNG(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Set background to transparent
  ctx.clearRect(0, 0, size, size);
  
  // Set golden color
  const scale = size / 100;
  ctx.strokeStyle = '#FFD700';
  ctx.fillStyle = '#FFD700';
  ctx.lineWidth = 2 * scale;
  
  // Draw outer circle
  ctx.beginPath();
  ctx.arc(size/2, size/2, 30 * scale, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Draw inner web pattern
  ctx.lineWidth = 1 * scale;
  
  // Petal patterns
  const centerX = size/2;
  const centerY = size/2;
  
  // Draw petals
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 30*scale);
  ctx.quadraticCurveTo(centerX - 15*scale, centerY - 15*scale, centerX, centerY);
  ctx.quadraticCurveTo(centerX + 15*scale, centerY - 15*scale, centerX, centerY - 30*scale);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX + 30*scale, centerY);
  ctx.quadraticCurveTo(centerX + 15*scale, centerY - 15*scale, centerX, centerY);
  ctx.quadraticCurveTo(centerX + 15*scale, centerY + 15*scale, centerX + 30*scale, centerY);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + 30*scale);
  ctx.quadraticCurveTo(centerX + 15*scale, centerY + 15*scale, centerX, centerY);
  ctx.quadraticCurveTo(centerX - 15*scale, centerY + 15*scale, centerX, centerY + 30*scale);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX - 30*scale, centerY);
  ctx.quadraticCurveTo(centerX - 15*scale, centerY + 15*scale, centerX, centerY);
  ctx.quadraticCurveTo(centerX - 15*scale, centerY - 15*scale, centerX - 30*scale, centerY);
  ctx.stroke();
  
  // Center circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, 6 * scale, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Add feathers
  ctx.fillRect(centerX - 2*scale, centerY + 38*scale, 4*scale, 8*scale);
  ctx.fillRect(centerX - 7*scale, centerY + 36*scale, 3*scale, 6*scale);
  ctx.fillRect(centerX + 4*scale, centerY + 36*scale, 3*scale, 6*scale);
  
  return canvas.toBuffer('image/png');
}

// Generate icons
try {
  const icon192 = createDreamcatcherPNG(192);
  const icon512 = createDreamcatcherPNG(512);
  
  fs.writeFileSync('client/public/icons/icon-192.png', icon192);
  fs.writeFileSync('client/public/icons/icon-512.png', icon512);
  
  console.log('✅ PNG icons generated successfully!');
} catch (error) {
  console.error('❌ Error generating icons:', error.message);
  console.log('Installing canvas dependency...');
  
  // Fallback: create simple colored squares as placeholder
  const { createCanvas } = require('canvas');
  
  function createSimplePNG(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Gold background
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 0, size, size);
    
    // Dark circle in center
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/3, 0, 2 * Math.PI);
    ctx.fill();
    
    // "DC" text
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${size/4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DC', size/2, size/2);
    
    return canvas.toBuffer('image/png');
  }
  
  const simple192 = createSimplePNG(192);
  const simple512 = createSimplePNG(512);
  
  fs.writeFileSync('client/public/icons/icon-192.png', simple192);
  fs.writeFileSync('client/public/icons/icon-512.png', simple512);
  
  console.log('✅ Fallback PNG icons created!');
}
