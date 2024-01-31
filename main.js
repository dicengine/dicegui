const {app, BrowserWindow, ipcMain, dialog} = require('electron')
var path = require('path')

require('@electron/remote/main').initialize()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windows = [];

function createWindow(args) {
    // Create the browser window.
    var w = 800;
    var h = 600;
    var i = path.join(__dirname, 'images/icons/png/icon_32x32@2x.png');
    var page_path = `file://${__dirname}/index.html`;
    if(args!==undefined){
	const {arg1, arg2, arg3} = args;
	w = arg1;
	h = arg2;
	page_path = arg3;
	// TODO enable icon as an argument
    }
    const win = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
	    contextIsolation: false,
	    enableRemoteModule: true
        },
        width: w,
        height: h,
	icon: i
    })
    require('@electron/remote/main').enable(win.webContents)    
    // and load the index.html of the app.
    win.loadURL(page_path)
    // Emitted when the window is closed.
    win.on('closed', () => {
        // Remove the closed window from the array
        windows.splice(windows.indexOf(win), 1);
    })
    if(args==undefined){
	win.maximize();
    }
    windows.push(win);
}


function createDialog(event, args){
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()

  // Handle IPC messages from the renderer process
  ipcMain.on('open-dialog-request', (event,args) => {
      // Show an open dialog
      dialog.showOpenDialog(args).then(result => {
          // Send the dialog result back to the renderer process
          event.sender.send('open-dialog-response', result);
      }).catch(err => {
          console.error(err);
      });
  });

  ipcMain.on('create-window', (event, args) => {
    // Create the browser window.
    createWindow(args);
  });
    
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
   // On macOS it's common to re-create a window in the app when the
   // dock icon is clicked and there are no other windows open.
   if (windows.length == 0) {
        createWindow()
   }
})
