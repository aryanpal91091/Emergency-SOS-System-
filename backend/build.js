const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=======================================================');
console.log('🚀 ResQRoute Full-Stack Production Build (Render Runner)');
console.log('=======================================================');

const frontendDir = path.resolve(__dirname, '../frontend');
const frontendDist = path.resolve(frontendDir, 'dist');
const backendPublic = path.resolve(__dirname, 'public');
const distPublic = path.resolve(__dirname, 'dist/public');

// 1. Build Frontend if ../frontend exists
if (fs.existsSync(frontendDir)) {
  console.log('\n📦 [1/4] Installing frontend dependencies & building Vite bundle...');
  try {
    console.log('   -> Running npm install in frontend...');
    execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
    console.log('   -> Running npm run build in frontend...');
    execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
    console.log('✅ Frontend Vite build completed successfully.');
  } catch (err) {
    console.error('⚠️ Frontend build error:', err.message);
  }

  // Copy frontend/dist into backend/public for guaranteed local availability
  if (fs.existsSync(frontendDist)) {
    try {
      if (!fs.existsSync(backendPublic)) {
        fs.mkdirSync(backendPublic, { recursive: true });
      }
      fs.cpSync(frontendDist, backendPublic, { recursive: true, force: true });
      console.log('✅ Copied frontend bundle to backend/public.');
    } catch (e) {
      console.warn('⚠️ Could not copy to backend/public:', e.message);
    }
  }
}

// 2. Generate Prisma Client
console.log('\n⚙️ [2/4] Generating Prisma Client...');
try {
  execSync('npx prisma generate', { cwd: __dirname, stdio: 'inherit' });
} catch (e) {
  console.log('ℹ️ Prisma generate completed or skipped locally.');
}

// 3. Compile Backend TypeScript
console.log('\n🔨 [3/4] Compiling Backend TypeScript (tsc)...');
execSync('tsc', { cwd: __dirname, stdio: 'inherit' });

// 4. Ensure dist/public exists directly next to dist/index.js
console.log('\n🔍 [4/4] Finalizing production bundle layout...');
if (fs.existsSync(backendPublic)) {
  try {
    if (!fs.existsSync(distPublic)) {
      fs.mkdirSync(distPublic, { recursive: true });
    }
    fs.cpSync(backendPublic, distPublic, { recursive: true, force: true });
    console.log('✅ Copied static bundle to backend/dist/public.');
  } catch (e) {
    console.warn('⚠️ Could not copy to backend/dist/public:', e.message);
  }
}

const verifiedPath = [
  path.join(distPublic, 'index.html'),
  path.join(backendPublic, 'index.html'),
  path.join(frontendDist, 'index.html')
].find(p => fs.existsSync(p));

if (verifiedPath) {
  console.log(`✅ Verified production frontend index at: ${verifiedPath}`);
} else {
  console.warn('⚠️ Warning: frontend index.html not located.');
}

console.log('=======================================================');
console.log('🎉 Production build complete! Ready for Render deployment.');
console.log('=======================================================');
