import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type StoredObject = { body: Buffer; contentType?: string };

/**
 * Everything the Lambdas need from the media bucket, and nothing else. The
 * handlers are written against this interface so tests run on the in-memory
 * implementation in `memory-store.ts`.
 */
export interface ObjectStore {
  /** Null when the key does not exist. */
  getObject(key: string): Promise<StoredObject | null>;
  putObject(
    key: string,
    body: Buffer | string,
    contentType: string,
    cacheControl?: string,
  ): Promise<void>;
  deleteObject(key: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<void>;
  listKeys(prefix: string): Promise<string[]>;
  /** A URL the browser can PUT the file to, valid for `expiresSeconds`. */
  presignPut(
    key: string,
    contentType: string,
    expiresSeconds: number,
  ): Promise<string>;
}

const isNoSuchKey = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  (error.name === "NoSuchKey" || error.name === "NotFound");

const DELETE_BATCH = 1000;

export const createS3Store = (
  bucket: string,
  client: S3Client = new S3Client({}),
): ObjectStore => ({
  async getObject(key) {
    try {
      const response = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      const bytes = await response.Body?.transformToByteArray();
      return {
        body: Buffer.from(bytes ?? new Uint8Array()),
        contentType: response.ContentType,
      };
    } catch (error) {
      if (isNoSuchKey(error)) return null;
      throw error;
    }
  },

  async putObject(key, body, contentType, cacheControl) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: cacheControl,
      }),
    );
  },

  async deleteObject(key) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },

  async deleteByPrefix(prefix) {
    const keys = await this.listKeys(prefix);
    for (let i = 0; i < keys.length; i += DELETE_BATCH) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: keys.slice(i, i + DELETE_BATCH).map((Key) => ({ Key })),
            Quiet: true,
          },
        }),
      );
    }
  },

  async listKeys(prefix) {
    const keys: string[] = [];
    let token: string | undefined;
    do {
      const page = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: token,
        }),
      );
      for (const object of page.Contents ?? []) {
        if (object.Key) keys.push(object.Key);
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    return keys;
  },

  presignPut(key, contentType, expiresSeconds) {
    // ContentType is part of the signature, so the browser must send exactly
    // this header — the admin API echoes it back for that reason.
    return getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: expiresSeconds },
    );
  },
});
