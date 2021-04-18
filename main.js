const { app, BrowserWindow, Menu} = require('electron')

app.allowRendererProcessReuse = false

function createWindow () {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    frame: true, transparent: true, alwaysOnTop: false, backgroundColor:'#1F2937'
  })
  var menu= null
  Menu.setApplicationMenu(menu)
  win.setResizable(true)

  win.loadFile('Views/login.html')
  win.openDevTools()

}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
app.once('ready-to-show', () => {
  win.show();
})
