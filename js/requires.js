const os = require('os');
const { BrowserWindow, ipcRenderer, shell } = require('electron');
const { dialog } = require('@electron/remote')
var ipcMain = require('electron').ipcMain;
const fs = require('fs');
const homeDir = os.homedir();
