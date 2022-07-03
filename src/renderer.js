const setButton = document.getElementById("saveButton");
const serviceAccountEl = document.getElementById("serviceAccountInput");
const bucketNameEl = document.getElementById("bucketNameInput");
setButton.addEventListener("click", () => {
  const serviceAccount = serviceAccountEl.value;
  const bucketName = bucketNameEl.value;
  if (serviceAccount && bucketName) {
    window.electronAPI.setSettings({ serviceAccount, bucketName });
    window.close();
  }
});

window.electronAPI.onLoadSettings((_event, settings) => {
  // TODO: this doesnt work
  serviceAccountEl.value = settings.serviceAccount;
  bucketNameEl.value = settings.bucketName;
});
