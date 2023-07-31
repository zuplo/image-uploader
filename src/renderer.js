const setButton = document.getElementById("saveButton");
const bucketNameEl = document.getElementById("bucketNameInput");
setButton.addEventListener("click", () => {
  const bucketName = bucketNameEl.value;
  if (bucketName) {
    window.electronAPI.setSettings({ bucketName });
    window.close();
  }
});

window.electronAPI.onLoadSettings((_event, settings) => {
  console.log(settings);
  bucketNameEl.value = settings.bucketName;
});
