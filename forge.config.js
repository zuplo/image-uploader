module.exports = {
  osxSign: {},
  packagerConfig: {},
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "zuplo",
          name: "image-uploader",
        },
        prerelease: false,
      },
    },
  ],
  makers: [
    // {
    //   name: "@electron-forge/maker-dmg",
    // },
    {
      name: "@electron-forge/maker-pkg",
    },
    // {
    //   name: "@electron-forge/maker-zip",
    //   platforms: ["darwin"],
    // },
  ],
};
