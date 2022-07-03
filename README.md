# Image Upload Tool

This utility puts an icon in the menubar that you can drop images onto to upload them to a Google Storage Bucket.

Images will be uploaded to `https://<YOUR_BUCKET>/assets/<UUID>.ext`

After the upload, markdown will be written to your clipboard like:

```
![](https://<YOUR_BUCKET>/assets/<UUID>.ext)
```

## Setup

1. Create a Google Cloud Service account with permission to upload to the bucket you would like to use
2. Open the **Setup** window through the application's menu icon.
3. Enter the JSON value of the service account and the bucket name in the form and click save
