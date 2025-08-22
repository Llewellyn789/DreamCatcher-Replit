
const fs = require('fs');
const { createCanvas } = require('canvas');

// Function to create a PNG icon
function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, size, size);
  
  // Center coordinates
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Main circle with gradient effect
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 0.4);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#0a0a0a');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.3, 0, 2 * Math.PI);
  ctx.fill();
  
  // Concentric circles
  const circles = [
    { radius: size * 0.25, width: 4, opacity: 0.6 },
    { radius: size * 0.16, width: 2, opacity: 0.4 },
    { radius: size * 0.08, width: 2, opacity: 0.3 }
  ];
  
  circles.forEach(circle => {
    ctx.strokeStyle = `rgba(255, 215, 0, ${circle.opacity})`;
    ctx.lineWidth = circle.width;
    ctx.beginPath();
    ctx.arc(centerX, centerY, circle.radius, 0, 2 * Math.PI);
    ctx.stroke();
  });
  
  // Center dot
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.04, 0, 2 * Math.PI);
  ctx.fill();
  
  // Corner stars
  const starPositions = [
    { x: size * 0.35, y: size * 0.35 },
    { x: size * 0.65, y: size * 0.35 },
    { x: size * 0.35, y: size * 0.65 },
    { x: size * 0.65, y: size * 0.65 }
  ];
  
  starPositions.forEach(pos => {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size * 0.012, 0, 2 * Math.PI);
    ctx.fill();
  });
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`client/public/icons/${filename}`, buffer);
  console.log(`Created ${filename} (${size}x${size})`);
}

// Ensure icons directory exists
if (!fs.existsSync('client/public/icons')) {
  fs.mkdirSync('client/public/icons', { recursive: true });
}

// Generate icons
createIcon(192, 'icon-192.png');
createIcon(512, 'icon-512.png');

console.log('All PNG icons created successfully!');
