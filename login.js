const electron = require('electron')
const BrowserWindow = electron.remote.BrowserWindow
const loginButton = document.getElementById('loginButton')
loginButton.addEventListener('click', () => {
    console.log("clicked")
    const modalPath = ('file://'+__dirname +'/main.html')
    let win = new BrowserWindow({ nodeInegration: true,enableRemoteModule: true,contextIsolation: true,width: 1920, height: 1080, minHeight:720, minWidth:1280, backgroundColor: '#1F2937' })
    win.on('close', function () { win = null })
    win.loadURL(modalPath)
    win.openDevTools()
    win.once('ready-to-show', () => {
      win.show()
    })
  })