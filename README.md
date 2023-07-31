# Image Upload Tool

This utility puts an icon in the menubar that you can drop images onto to upload them to a Google Storage Bucket.

Images will be uploaded to `https://<YOUR_BUCKET>/assets/<UUID>.ext`

After the upload, markdown will be written to your clipboard like:

```
https://<YOUR_BUCKET>/assets/<UUID>.ext
```

## Setup

1. Login to your Google Account using the gcloud CLI. [Google Docs](https://cloud.google.com/sdk/docs/authorizing)
2. Open the **Setup** window through the application's menu icon.
3. Enter bucket name where you want to upload the assets (i.e. `my-bucket-name`)
4. Click Save
