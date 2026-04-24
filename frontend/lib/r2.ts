import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_client) return _client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKey || !secretKey) {
    throw new Error(
      "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY moraju biti postavljeni"
    );
  }

  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });
  return _client;
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.R2_PUBLIC_URL;
  if (!bucket || !publicBase) {
    throw new Error("R2_BUCKET_NAME i R2_PUBLIC_URL moraju biti postavljeni");
  }

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000",
    })
  );

  return `${publicBase.replace(/\/+$/, "")}/${key}`;
}
