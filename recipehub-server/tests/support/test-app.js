import { randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import path from 'node:path';

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(process.cwd(), 'node_modules/.cache/mongodb-binaries');
const mongoServer = await MongoMemoryServer.create();
const testMongoUri = mongoServer.getUri();
process.env.NODE_ENV = 'test';
process.env.RECIPEHUB_TEST_MONGO_URI = testMongoUri;
process.env.MONGO_DB_URI = testMongoUri;
process.env.DB_NAME = `recipehub_test_${process.pid}`;
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.BETTER_AUTH_SECRET = randomBytes(32).toString('base64url');
process.env.BETTER_AUTH_URL = 'http://localhost:3000';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.GOOGLE_CLIENT_ID = 'recipehub-test.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = 'synthetic-test-only-secret';
process.env.STRIPE_SECRET_KEY = `sk_test_${randomBytes(24).toString('hex')}`;
process.env.STRIPE_WEBHOOK_SECRET = `whsec_${randomBytes(32).toString('hex')}`;

let app;
let mongoClient;
let database;
let connectDatabase;
try {
  ({ default: app } = await import('../../app.js'));
  ({ client: mongoClient, getDb: database, connectDB: connectDatabase } = await import('../../db.js'));
  await connectDatabase();
} catch (error) {
  await mongoServer.stop();
  throw error;
}

export const api = request(app);
export const getCollection = name => database().collection(name);

export function makeUser(overrides = {}) {
  return {
    id: new ObjectId().toString(),
    email: `${randomUUID()}@example.test`,
    name: 'Synthetic Test User',
    role: 'user',
    isPremium: false,
    ...overrides
  };
}

export function tokenFor(user) {
  return jwt.sign({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isPremium: user.isPremium
  }, process.env.JWT_SECRET, { expiresIn: '5m' });
}

export async function seedUser(user) {
  await getCollection('users').insertOne({
    _id: new ObjectId(user.id), email: user.email, name: user.name,
    role: user.role, isPremium: user.isPremium, isBlocked: false
  });
}

export async function seedRecipe(overrides = {}) {
  const recipe = {
    title: 'Synthetic Test Recipe',
    image: 'https://example.test/recipe.jpg',
    category: 'Dinner',
    cookingTime: 30,
    ingredients: ['rice'],
    instructions: ['Cook carefully'],
    isPremium: false,
    authorName: 'Synthetic Author',
    authorEmail: 'author@example.test',
    likes: [],
    likesCount: 0,
    isFeatured: false,
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
  const result = await getCollection('recipes').insertOne(recipe);
  return { ...recipe, _id: result.insertedId };
}

export async function clearDatabase() {
  const collections = await database().listCollections().toArray();
  await Promise.all(collections.map(({ name }) => getCollection(name).deleteMany({})));
}

export async function closeTestDatabase() {
  await mongoClient.close();
  await mongoServer.stop();
}
