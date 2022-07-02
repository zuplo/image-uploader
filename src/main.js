const {
  app,
  Menu,
  Tray,
  BrowserWindow,
  clipboard,
  dialog,
} = require("electron");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");
const { Storage } = require("@google-cloud/storage");
const homedir = require("os").homedir();

const PROJECT_ID = "zuplo-production";
const BUCKET_NAME = "cdn.zuplo.com";

app.setLoginItemSettings({
  openAtLogin: true,
});

let tray = null;
app.whenReady().then(() => {
  app.dock.hide();

  const iconPath = path.join(__dirname, "icon/drop.png");
  tray = new Tray(iconPath);
  tray.setToolTip("Drop images here.");
  tray.on("drop-files", (event, files) => {
    const keyFilename = path.join(homedir, "zuplo-cdn-upload-account.json");
    if (!fs.existsSync(keyFilename)) {
      showSetupInstructions();
      return;
    }
    console.log(keyFilename);
    uploadFiles(keyFilename, files)
      .then((files) => {
        const markdownFiles = files.map((f) => `![](${f})`);
        const markdown = markdownFiles.join("\n");
        clipboard.writeText(markdown);
      })
      .catch((err) => {
        dialog.showErrorBox(
          "An error has occurred",
          err.message ?? "unknown error"
        );
      });
  });
});

const showSetupInstructions = () => {
  const win = new BrowserWindow({
    width: 600,
    height: 200,
  });

  const setupFile = path.join(__dirname, "setup.html");
  win.loadFile(setupFile);
};

async function uploadFiles(keyFilename, files) {
  const uploadedFiles = [];
  const storage = new Storage({ projectId: PROJECT_ID, keyFilename });
  const tasks = files.map(async (file) => {
    const extension = path.extname(file);
    const fileId = randomUUID();
    const destFileName = `assets/${fileId}${extension}`;

    await storage.bucket(BUCKET_NAME).upload(file, {
      destination: destFileName,
    });

    uploadedFiles.push(`https://cdn.zuplo.com/${destFileName}`);
  });
  await Promise.all(tasks);
  return uploadedFiles;
}
