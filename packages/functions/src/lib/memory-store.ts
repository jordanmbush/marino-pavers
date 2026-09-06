import type { ObjectStore, StoredObject } from "./s3";

export type MemoryStore = ObjectStore & {
  readonly objects: Map<string, StoredObject & { cacheControl?: string }>;
  /** Keys passed to `touchObject`, in order. There is no S3 to notify here. */
  readonly touched: string[];
};

/** The bucket as a Map, for tests. Presigned URLs are fake but carry the key. */
export const createMemoryStore = (): MemoryStore => {
  const objects = new Map<string, StoredObject & { cacheControl?: string }>();
  const touched: string[] = [];
  return {
    objects,
    touched,
    async getObject(key) {
      const object = objects.get(key);
      return object
        ? { body: object.body, contentType: object.contentType }
        : null;
    },
    async putObject(key, body, contentType, cacheControl) {
      objects.set(key, {
        body: typeof body === "string" ? Buffer.from(body, "utf8") : body,
        contentType,
        cacheControl,
      });
    },
    async deleteObject(key) {
      objects.delete(key);
    },
    async deleteByPrefix(prefix) {
      for (const key of [...objects.keys()]) {
        if (key.startsWith(prefix)) objects.delete(key);
      }
    },
    async listKeys(prefix) {
      return [...objects.keys()].filter((key) => key.startsWith(prefix)).sort();
    },
    async touchObject(key, contentType) {
      const object = objects.get(key);
      if (!object) throw new Error(`No such key: ${key}`);
      objects.set(key, { ...object, contentType });
      touched.push(key);
    },
    async presignPut(key, contentType, expiresSeconds) {
      return `https://media.test/${key}?X-Amz-Expires=${expiresSeconds}&content-type=${encodeURIComponent(contentType)}`;
    },
  };
};
