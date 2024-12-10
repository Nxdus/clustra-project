import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function generateSignedUrl(path: string) {
  try {
    const client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });
    
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: path,
    });
    
    return await getSignedUrl(client, command, {
      expiresIn: 3600 // 1 ชั่วโมง
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
} 