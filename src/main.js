const {
  app,
  Menu,
  Tray,
  clipboard,
  dialog,
  shell,
  safeStorage,
  BrowserWindow,
  ipcMain,
} = require("electron");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");
const { Storage } = require("@google-cloud/storage");

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
    const win = BrowserWindow.fromWebContents(webContents);
    saveSettings(settings.serviceAccount, settings.bucketName)
      .then(() => {
        win.webContents.send("load-settings", settings);
      })
      .catch(console.error);
  });

  tray.on("drop-files", (event, files) => {
    getSettings()
      .then((settings) => {
        if (!settings?.bucketName || !settings?.serviceAccount) {
          showSetup();
          return;
        }
        return uploadFiles(settings, files).then((files) => {
          const markdownFiles = files.map((f) => `![](${f})`);
          const markdown = markdownFiles.join("\n");
          clipboard.writeText(markdown);
        });
      })
      .catch((err) => {
        dialog.showErrorBox(
          "An error has occurred",
          err.message ?? "unknown error"
        );
      });
  });
});

async function uploadFiles(settings, files) {
  const uploadedFiles = [];
  const credentials = JSON.parse(settings.serviceAccount);
  const storage = new Storage({ credentials });
  const tasks = files.map(async (file) => {
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

async function saveSettings(serviceAccountJson, bucketName) {
  const serviceAccount = safeStorage
    .encryptString(serviceAccountJson)
    .toString("hex");
  const settings = JSON.stringify({ serviceAccount, bucketName });
  fs.promises.writeFile(getSettingsPath(), settings, "utf-8");
}

async function getSettings() {
  let settingsJson;
  try {
    settingsJson = await fs.promises.readFile(getSettingsPath(), "utf-8");
  } catch (err) {
    return { serviceAccount: null, bucketName: null };
  }
  const settings = JSON.parse(settingsJson);
  const bucketName = settings.bucketName;
  const serviceAccountBuf = Buffer.from(settings.serviceAccount, "hex");
  const serviceAccount = safeStorage.decryptString(serviceAccountBuf);
  return { bucketName, serviceAccount };
}

const showSetup = () => {
  const win = new BrowserWindow({
    width: 600,
    height: 440,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  getSettings()
    .then((settings) => {
      const setupFile = path.join(__dirname, "setup.html");
      win.loadFile(setupFile);

      win.webContents.send("load-settings", settings);
    })
    .catch(console.error);
};

app.on("window-all-closed", function () {});
