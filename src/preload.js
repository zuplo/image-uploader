const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  setSettings: (settings) => ipcRenderer.send("set-settings", settings),
  onLoadSettings: (callback) => ipcRenderer.on("load-settings", callback),
});
