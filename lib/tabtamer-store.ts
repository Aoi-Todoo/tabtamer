import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_COLLECTIONS = ["Java Interview Prep", "DSA Practice", "College Projects"] as const;

export type SavedLink = {
  id: string;
  title: string;
  url: string;
  href: string;
  collection: string;
  tags: string[];
  note?: string;
  icon: "book" | "code" | "folder";
};

type Store = {
  collections: string[];
  links: SavedLink[];
  deletedSampleIds?: string[];
};

const dataDir = path.join(process.cwd(), "data");
const dataPath = path.join(dataDir, "tabtamer.json");
let writeQueue: Promise<unknown> = Promise.resolve();

export class StoreError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function writeStore(store: Store) {
  await mkdir(dataDir, { recursive: true });
  const tempPath = `${dataPath}.${process.pid}.tmp`;
  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tempPath, dataPath);
}

export async function getStore(): Promise<Store> {
  await mkdir(dataDir, { recursive: true });
  try {
    const saved = await readFile(dataPath, "utf8");
    const parsed: unknown = JSON.parse(saved);
    if (
      typeof parsed === "object" && parsed !== null
      && Array.isArray((parsed as Store).collections)
      && Array.isArray((parsed as Store).links)
    ) {
      const store = parsed as Store;
      return { ...store, deletedSampleIds: Array.isArray(store.deletedSampleIds) ? store.deletedSampleIds : [] };
    }
    throw new StoreError("The library data file has an invalid format.", 500);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const initial: Store = { collections: [], links: [], deletedSampleIds: [] };
    await writeStore(initial);
    return initial;
  }
}

function mutate<T>(operation: (store: Store) => T | Promise<T>): Promise<T> {
  const task = writeQueue.then(async () => {
    const store = await getStore();
    const result = await operation(store);
    await writeStore(store);
    return result;
  });
  writeQueue = task.catch(() => undefined);
  return task;
}

export function createCollection(name: string): Promise<string> {
  return mutate((store) => {
    const cleanName = name.trim();
    if (!cleanName || cleanName.length > 40) throw new StoreError("Use a collection name between 1 and 40 characters.");
    if ([...DEFAULT_COLLECTIONS, ...store.collections].some((item) => item.toLowerCase() === cleanName.toLowerCase())) {
      throw new StoreError("That collection already exists.", 409);
    }
    store.collections.push(cleanName);
    return cleanName;
  });
}

export function deleteCollection(name: string): Promise<void> {
  return mutate((store) => {
    if (DEFAULT_COLLECTIONS.some((item) => item.toLowerCase() === name.toLowerCase())) {
      throw new StoreError("Built-in collections cannot be removed.", 400);
    }
    const actual = store.collections.find((item) => item.toLowerCase() === name.toLowerCase());
    if (!actual) throw new StoreError("Collection not found.", 404);
    if (store.links.some((link) => link.collection === actual)) {
      throw new StoreError("Move or remove this collection’s links before deleting it.", 409);
    }
    store.collections = store.collections.filter((item) => item !== actual);
  });
}

function normalizeLink(input: Partial<SavedLink>, collectionNames: string[], existingId?: string): SavedLink {
  const rawHref = typeof input.href === "string" ? input.href.trim() : typeof input.url === "string" ? input.url.trim() : "";
  const absoluteHref = /^https?:\/\//i.test(rawHref) ? rawHref : `https://${rawHref}`;
  let parsed: URL;
  try {
    parsed = new URL(absoluteHref);
  } catch {
    throw new StoreError("Enter a valid website address.");
  }
  if (!(["http:", "https:"].includes(parsed.protocol)) || !parsed.hostname.includes(".")) {
    throw new StoreError("Enter a valid http or https website address.");
  }
  const collection = typeof input.collection === "string" ? input.collection.trim() : "";
  if (!collectionNames.includes(collection)) throw new StoreError("Choose an existing collection.");
  const displayUrl = `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}${parsed.search}`;
  const tags = Array.isArray(input.tags)
    ? [...new Set(input.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean).slice(0, 20))]
    : [];
  const icon = input.icon === "book" || input.icon === "code" ? input.icon : "folder";
  return {
    id: existingId ?? randomUUID(),
    title: typeof input.title === "string" && input.title.trim() ? input.title.trim().slice(0, 140) : displayUrl,
    url: displayUrl,
    href: parsed.href,
    collection,
    tags,
    note: typeof input.note === "string" && input.note.trim() ? input.note.trim().slice(0, 500) : undefined,
    icon,
  };
}

export function createLink(input: Partial<SavedLink>): Promise<SavedLink> {
  return mutate((store) => {
    const collectionNames = [...DEFAULT_COLLECTIONS, ...store.collections];
    const link = normalizeLink(input, collectionNames);
    if (store.links.some((item) => item.href.replace(/\/$/, "") === link.href.replace(/\/$/, ""))) {
      throw new StoreError("That link is already in your library.", 409);
    }
    store.links.push(link);
    return link;
  });
}

export function updateLink(id: string, input: Partial<SavedLink>): Promise<SavedLink> {
  return mutate((store) => {
    const index = store.links.findIndex((item) => item.id === id);
    if (index < 0) throw new StoreError("Saved link not found.", 404);
    const link = normalizeLink({ ...store.links[index], ...input }, [...DEFAULT_COLLECTIONS, ...store.collections], id);
    if (store.links.some((item) => item.id !== id && item.href.replace(/\/$/, "") === link.href.replace(/\/$/, ""))) {
      throw new StoreError("That link is already in your library.", 409);
    }
    store.links[index] = link;
    return link;
  });
}

export function deleteLink(id: string): Promise<void> {
  return mutate((store) => {
    const sampleIds = ["sample-jcip", "sample-java-collections", "sample-neetcode", "sample-visualgo", "sample-nextjs", "sample-ddia"];
    if (sampleIds.includes(id)) {
      store.deletedSampleIds ??= [];
      if (!store.deletedSampleIds.includes(id)) store.deletedSampleIds.push(id);
      return;
    }
    const index = store.links.findIndex((item) => item.id === id);
    if (index < 0) throw new StoreError("Saved link not found.", 404);
    store.links.splice(index, 1);
  });
}
