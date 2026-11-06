import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_DB_URI;
const dbName = process.env.DB_NAME || "test";

if (process.env.NODE_ENV === 'test') {
  const expectedTestUri = process.env.RECIPEHUB_TEST_MONGO_URI;
  if (!expectedTestUri || uri !== expectedTestUri) {
    throw new Error('Test mode requires the exact MongoMemoryServer URI supplied by the test harness.');
  }
  if (!/^recipehub_test_\d+$/.test(dbName)) {
    throw new Error('Test mode requires an isolated recipehub_test_<pid> database name.');
  }
}

if (!uri) {
  console.error("MONGO_DB_URI is not defined in the environment variables!");
  process.exit(1);
}

const client = new MongoClient(uri);

let db = null;

export async function connectDB() {
  if (db) return db;
  try {
    await client.connect();
    db = client.db(dbName);
    await db.collection('payments').createIndex(
      { checkoutSessionId: 1 },
      { unique: true, sparse: true, name: 'uniq_payments_checkout_session_id' }
    );
    const collections = await db.listCollections().toArray();
console.log("Collections:", collections.map(c => c.name));
    console.log(`Connected to MongoDB database: ${dbName}`);
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
}

export function getCollection(name) {
  return getDb().collection(name);
}

export { client };
