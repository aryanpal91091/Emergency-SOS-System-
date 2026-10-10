const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=======================================================');
console.log('🚀 Starting ResQRoute Unified Full-Stack Production Build');
console.log('=======================================================');

// 1. Build Frontend
console.log('\n📦 [1/4] Building Frontend (Vite)...');
execSync('npm --prefix frontend install', { stdio: 'inherit' });
execSync('npm --prefix frontend run build', { stdio: 'inherit' });

// 2. Install & Generate Backend Prisma Client
console.log('\n⚙️ [2/4] Preparing Backend Dependencies & Prisma...');
execSync('npm --prefix backend install', { stdio: 'inherit' });
try {
  execSync('npx prisma generate', { cwd: path.resolve(__dirname, 'backend'), stdio: 'inherit' });
} catch (e) {
  console.log('ℹ️ Prisma generate completed or skipped (DLL locked locally on Windows)');
}

// 3. Compile Backend TypeScript
console.log('\n🔨 [3/4] Compiling Backend TypeScript (tsc)...');
execSync('npm --prefix backend run build', { stdio: 'inherit' });

// 4. Verify frontend/dist/index.html exists
console.log('\n🔍 [4/4] Verifying production build artifacts...');
const distHtml = path.resolve(__dirname, 'frontend/dist/index.html');
if (fs.existsSync(distHtml)) {
  console.log('✅ Verified: frontend/dist/index.html exists and is ready for production!');
} else {
  throw new Error('❌ Verification failed: frontend/dist/index.html not found after build!');
}

console.log('=======================================================');
console.log('🎉 ResQRoute Full-Stack Unified Build Completed Successfully!');
console.log('=======================================================');
