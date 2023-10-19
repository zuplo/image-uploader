const {
  app,
  Menu,
  Tray,
  clipboard,
  dialog,
  shell,
  BrowserWindow,
  ipcMain,
} = require("electron");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");
const { Storage } = require("@google-cloud/storage");
const log = require("electron-log/main");

log.initialize({ preload: true });
require("update-electron-app")();

app.setLoginItemSettings({
  openAtLogin: true,
  name: "Image Drop",
});

let tray = null;
app.whenReady().then(() => {
  app.dock.hide();

  const iconPath = path.join(__dirname, "icon/TrayTemplate.png");
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Setup",
      type: "normal",
      click: showSetup,
    },
    {
      label: "About",
      type: "normal",
      click: () => {
        shell.openExternal("https://github.com/zuplo/image-uploader");
      },
    },
    {
      type: "separator",
    },
    {
      label: "Quit",
      type: "normal",
      role: "quit",
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setToolTip("Drop images here.");
  tray.setContextMenu(contextMenu);

  ipcMain.on("set-settings", (event, settings) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents, {
      webPreferences: {
        nodeIntegration: true,
      },
    });
    saveSettings(settings.bucketName)
      .then(() => {
        win.webContents.send("load-settings", settings);
      })
      .catch((err) => {
        log.error(err);
        dialog.showErrorBox(
          "An error has occurred",
          err.message ?? "unknown error"
        );
      });
  });

  tray.on("drop-files", (event, files) => {
    getSettings()
      .then((settings) => {
        if (!settings?.bucketName) {
          showSetup();
          return;
        }
        return uploadFiles(settings, files).then((files) => {
          clipboard.writeText(files.join("\n"));
        });
      })
      .catch((err) => {
        log.error(err);
        dialog.showErrorBox(
          "An error has occurred",
          err.message ?? "unknown error"
        );
      });
  });
});

async function uploadFiles(settings, files) {
  const uploadedFiles = [];
  const storage = new Storage();
  const tasks = files.map(async (file) => {
    log.debug(`Uploading file ${file}`);
    const extension = path.extname(file);
    const fileId = randomUUID();
    const destFileName = `assets/${fileId}${extension}`;

    await storage.bucket(settings.bucketName).upload(file, {
      destination: destFileName,
    });

    uploadedFiles.push(`https://${settings.bucketName}/${destFileName}`);
  });
  await Promise.all(tasks);
  return uploadedFiles;
}

const SETTINGS_FILE = "image-upload-settings.json";

function getSettingsPath() {
  const userData = app.getPath("userData");
  const settingsPath = path.join(userData, SETTINGS_FILE);
  return settingsPath;
}

async function saveSettings(bucketName) {
  const settings = JSON.stringify({ bucketName });
  fs.promises.writeFile(getSettingsPath(), settings, "utf-8");
}

async function getSettings() {
  let settingsJson;
  try {
    settingsJson = await fs.promises.readFile(getSettingsPath(), "utf-8");
  } catch (err) {
    log.error(err);
    return { bucketName: null };
  }
  const settings = JSON.parse(settingsJson);
  const bucketName = settings.bucketName;
  return { bucketName };
}

const showSetup = () => {
  const win = new BrowserWindow({
    width: 600,
    height: 300,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  getSettings()
    .then((settings) => {
      const setupFile = path.join(__dirname, "setup.html");
      return win.loadFile(setupFile).then(() => {
        win.webContents.send("load-settings", settings);
      });
    })
    .catch((err) => {
      log.error(err);
      dialog.showErrorBox(
        "An error has occurred",
        err.message ?? "unknown error"
      );
    });
};

app.on("window-all-closed", function () {});
