import { v2 as cloudinarySdk } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const hasCloudinaryConfig = Boolean(cloudName && apiKey && apiSecret);

const missingConfigMessage =
  '[cloudinary] CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET son requeridos.';

if (hasCloudinaryConfig) {
  cloudinarySdk.config({
    cloud_name: cloudName!,
    api_key: apiKey!,
    api_secret: apiSecret!,
    secure: true,
  });
} else if (process.env.NODE_ENV !== 'test') {
  console.warn(missingConfigMessage);
}

const cloudinary = hasCloudinaryConfig
  ? cloudinarySdk
  : ({
      uploader: {
        async upload() {
          throw new Error(missingConfigMessage);
        },
        async destroy() {
          throw new Error(missingConfigMessage);
        },
      },
      url() {
        throw new Error(missingConfigMessage);
      },
    } as unknown as typeof cloudinarySdk);

export { cloudinary, hasCloudinaryConfig };
