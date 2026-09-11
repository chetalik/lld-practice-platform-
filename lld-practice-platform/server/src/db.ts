import { MongoClient, type Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

// Simple singleton connection — one client for the app's lifetime.
export async function connectDB(): Promise<Db> {
  if (db) return db;
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGODB_DB || "lld_practice";
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  console.log(`Connected to MongoDB (${dbName})`);
  return db;
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
