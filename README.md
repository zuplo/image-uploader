# Image Upload Tool

This utility puts an icon in the menubar that you can drop images onto to upload them to the Zuplo CDN.

Images will be uploaded to `https://cdn.zuplo.com/assets/<UUID>.ext`

After the upload, markdown will be written to your clipboard like:

```
![](https://cdn.zuplo.com/assets/<UUID>.ext)
```
