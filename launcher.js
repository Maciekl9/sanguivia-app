const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Uruchamianie Sanguivia...');

// Sprawdź czy Electron jest zainstalowany
const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron.cmd');
const electronExe = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');

// Sprawdź czy pliki istnieją
if (!fs.existsSync(electronExe) && !fs.existsSync(electronPath)) {
  console.log('💡 Electron nie jest zainstalowany. Instaluję...');
  
  const npm = spawn('npm', ['install', 'electron', '--save-dev'], {
    stdio: 'inherit',
    cwd: __dirname,
    shell: true
  });
  
  npm.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Electron zainstalowany! Uruchamiam aplikację...');
      startElectron();
    } else {
      console.error('❌ Błąd instalacji Electron');
      process.exit(1);
    }
  });
} else {
  startElectron();
}

function startElectron() {
  // Użyj npx electron lub bezpośredniej ścieżki
  const electronCommand = fs.existsSync(electronPath) ? 'npx' : electronExe;
  const electronArgs = fs.existsSync(electronPath) ? ['electron', 'electron-simple.js'] : ['electron-simple.js'];
  
  const electron = spawn(electronCommand, electronArgs, {
    stdio: 'inherit',
    cwd: __dirname,
    shell: true,
    windowsHide: false
  });

  electron.on('error', (err) => {
    console.error('❌ Błąd uruchamiania Electron:', err);
    console.log('💡 Próbuję alternatywnej metody...');
    
    // Fallback - spróbuj uruchomić bezpośrednio
    const fallback = spawn('node', ['electron-simple.js'], {
      stdio: 'inherit',
      cwd: __dirname,
      shell: true
    });
    
    fallback.on('error', (fallbackErr) => {
      console.error('❌ Błąd uruchamiania aplikacji:', fallbackErr);
      process.exit(1);
    });
  });

  electron.on('close', (code) => {
    console.log(`📱 Sanguivia zamknięte z kodem: ${code}`);
  });
}
