import { CloudFrontClient, GetDistributionCommand } from "@aws-sdk/client-cloudfront";

export async function checkCloudFrontStatus() {
  const client = new CloudFrontClient({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
  });

  try {
    const command = new GetDistributionCommand({
      Id: process.env.CLOUDFRONT_DISTRIBUTION_ID!
    });
    const response = await client.send(command);
    return response.Distribution?.Status === 'Deployed';
  } catch (error) {
    console.error('Error checking CloudFront status:', error);
    return false;
  }
}