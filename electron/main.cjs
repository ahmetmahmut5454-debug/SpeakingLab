const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset', // Mac'te çok şık duran gömülü pencere tarzı
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    // Geliştirme aşamasında yerel sunucuya bağlanır
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools(); // Konsolu açmak istersen bunu aktif edebilirsin
  } else {
    // Uygulama paketlendiğinde derlenmiş HTML dosyasını okur
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  // Mac'in doğası gereği kırmızı çarpıya basılsa da program arka planda açık kalır (Dock'ta)
  if (process.platform !== 'darwin') app.quit();
});
