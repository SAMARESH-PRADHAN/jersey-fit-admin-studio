import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_BUCKET = process.env.S3_BUCKET_NAME || "jersey-fit-assets";
const S3_PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL;

export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "mock-access-key",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "mock-secret-key",
  },
  forcePathStyle: true,
});

export class StorageService {
  /**
   * Validate MIME type and size. Images <= 2MB, CSV <= 5MB
   */
  static validateUpload(type: "product_image" | "logo" | "roster", mimeType: string, sizeBytes?: number) {
    if (type === "product_image" || type === "logo") {
      if (!mimeType.startsWith("image/")) {
        throw new Error("Invalid file type: Must be an image");
      }
      if (sizeBytes && sizeBytes > 2 * 1024 * 1024) {
        throw new Error("File exceeds 2 MB limit");
      }
    } else if (type === "roster") {
      const validCsv = [
        "text/csv",
        "application/vnd.ms-excel",
        "text/plain",
      ];
      if (!validCsv.includes(mimeType)) {
        throw new Error("Invalid file type: Must be a CSV roster file");
      }
      if (sizeBytes && sizeBytes > 5 * 1024 * 1024) {
        throw new Error("Roster file exceeds 5 MB limit");
      }
    }
  }

  /**
   * Generates a signed PUT URL for direct client upload
   */
  static async getPresignedUploadUrl(params: {
    type?: "product_image" | "logo" | "roster";
    fileName?: string;
    filename?: string;
    mimeType?: string;
    contentType?: string;
    sizeBytes?: number;
    folder?: string;
    isPublic?: boolean;
  }) {
    const rawName = params.fileName || params.filename || "file.jpg";
    const mime = params.mimeType || params.contentType || "image/jpeg";
    const type: "product_image" | "logo" | "roster" = params.type || (params.folder === "products" ? "product_image" : "product_image");

    this.validateUpload(type, mime, params.sizeBytes);

    const ext = rawName.split(".").pop() || "jpg";
    const key = `${type}s/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: mime,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 mins

    // Product images are public, customer logo and roster are private
    const fileUrl =
      (type === "product_image" || params.isPublic) && S3_PUBLIC_BASE
        ? `${S3_PUBLIC_BASE}/${key}`
        : S3_ENDPOINT && S3_BUCKET
          ? `${S3_ENDPOINT}/${S3_BUCKET}/${key}`
          : key;

    return {
      uploadUrl,
      key,
      fileUrl,
    };
  }

  /**
   * Generates a signed GET URL for private files (logos, rosters)
   */
  static async getPresignedDownloadUrl(key: string, expiresInSeconds = 900) {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  }
}
