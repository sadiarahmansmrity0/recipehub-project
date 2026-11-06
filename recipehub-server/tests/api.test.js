import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import Stripe from 'stripe';
import { api, clearDatabase, closeTestDatabase, getCollection, makeUser, seedRecipe, seedUser, tokenFor } from './support/test-app.js';

beforeEach(clearDatabase);
beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
afterAll(async () => { await closeTestDatabase(); jest.restoreAllMocks(); });

describe('test database isolation and health', () => {
  test('rejects a different localhost MongoDB URI even with the expected test database name', () => {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', "import('./db.js').then(() => process.exit(2)).catch(error => process.exit(error.message.includes('exact MongoMemoryServer URI') ? 0 : 3))"], {
      cwd: process.cwd(), encoding: 'utf8', env: {
        ...process.env, NODE_ENV: 'test', MONGO_DB_URI: 'mongodb://127.0.0.1:27017/',
        RECIPEHUB_TEST_MONGO_URI: process.env.RECIPEHUB_TEST_MONGO_URI,
        DB_NAME: `recipehub_test_${process.pid}`
      }
    });
    expect(result.status).toBe(0);
  });

  test('returns a healthy API response with the isolated database connected', async () => {
    const response = await api.get('/api/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', database: true });
  });
});

describe('recipes and reviews', () => {
  test('returns paginated recipes in the frontend response shape', async () => {
    await seedRecipe({ title: 'Lentil Soup' });
    const response = await api.get('/api/recipes?page=1&limit=6').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0]).toMatchObject({ recipeName: 'Lentil Soup', recipeImage: 'https://example.test/recipe.jpg' });
    expect(response.body.pagination).toMatchObject({ totalRecipes: 1, page: 1, limit: 6, totalPages: 1 });
  });

  test('provides featured and popular home page lists', async () => {
    await seedRecipe({ title: 'Featured Dinner', isFeatured: true, likesCount: 4 });
    const featured = await api.get('/api/recipes/featured').expect(200);
    const popular = await api.get('/api/recipes/popular').expect(200);
    expect(featured.body.data[0].recipeName).toBe('Featured Dinner');
    expect(popular.body.data[0].likesCount).toBe(4);
  });

  test('public list, featured, popular, and detail responses redact premium content and reviewer identifiers', async () => {
    const privateReview = {
      _id: 'private-review-id', userId: 'private-user-id', userEmail: 'private@example.test',
      reviewerId: 'another-private-id', reviewerEmail: 'reviewer@example.test',
      userName: 'Public Reviewer', rating: 5, comment: 'Excellent recipe',
      createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z')
    };
    const recipe = await seedRecipe({
      title: 'Premium Preview', isPremium: true, isFeatured: true, likesCount: 9,
      ingredients: ['private ingredient'], importantTopics: ['private topic'],
      instructions: ['private full instruction'], reviews: [privateReview]
    });

    const responses = [
      await api.get('/api/recipes?page=1&limit=10').expect(200),
      await api.get('/api/recipes/featured').expect(200),
      await api.get('/api/recipes/popular').expect(200),
      await api.get(`/api/recipes/${recipe._id}`).expect(200)
    ];
    const publicRecipes = [
      responses[0].body.recipes[0], responses[0].body.data[0],
      responses[1].body.data[0], responses[2].body.data[0],
      responses[3].body.recipe, responses[3].body.data
    ];

    for (const publicRecipe of publicRecipes) {
      expect(publicRecipe.isLocked).toBe(true);
      expect(publicRecipe).not.toHaveProperty('ingredients');
      expect(publicRecipe).not.toHaveProperty('importantTopics');
      expect(publicRecipe).not.toHaveProperty('instructions');
      expect(publicRecipe.reviews[0]).toMatchObject({
        userName: 'Public Reviewer', rating: 5, comment: 'Excellent recipe',
        createdAt: privateReview.createdAt.toISOString(),
        updatedAt: privateReview.updatedAt.toISOString()
      });
      for (const privateField of ['_id', 'userId', 'userEmail', 'reviewerId', 'reviewerEmail']) {
        expect(publicRecipe.reviews[0]).not.toHaveProperty(privateField);
      }
    }
  });

  test('free recipes remain fully available and an authenticated premium member can access premium content', async () => {
    const freeRecipe = await seedRecipe({ title: 'Free Recipe' });
    const freeResponse = await api.get(`/api/recipes/${freeRecipe._id}`).expect(200);
    expect(freeResponse.body.data).toMatchObject({ isLocked: false, ingredients: ['rice'], instructions: ['Cook carefully'] });

    const member = makeUser({ isPremium: true });
    await seedUser(member);
    const premiumRecipe = await seedRecipe({
      title: 'Member Recipe', isPremium: true,
      ingredients: ['member ingredient'], instructions: ['member instructions']
    });
    const token = tokenFor(member);
    const detail = await api.get(`/api/recipes/${premiumRecipe._id}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(detail.body.data).toMatchObject({ isLocked: false, ingredients: ['member ingredient'], instructions: ['member instructions'] });

    const list = await api.get('/api/recipes?page=1&limit=10').set('Authorization', `Bearer ${token}`).expect(200);
    const listedPremium = list.body.data.find(item => item._id.toString() === premiumRecipe._id.toString());
    expect(listedPremium).toMatchObject({ isLocked: false, ingredients: ['member ingredient'], instructions: ['member instructions'] });
  });

  test('recipe owners, administrators, and recipe purchasers retain premium access', async () => {
    const owner = makeUser();
    const admin = makeUser({ role: 'admin' });
    const purchaser = makeUser();
    await Promise.all([seedUser(owner), seedUser(admin), seedUser(purchaser)]);
    const recipe = await seedRecipe({
      authorEmail: owner.email, isPremium: true,
      ingredients: ['authorized ingredient'], instructions: ['authorized instructions']
    });
    await getCollection('payments').insertOne({
      userId: purchaser.id, recipeId: recipe._id, paymentType: 'recipe', status: 'succeeded'
    });

    for (const user of [owner, admin, purchaser]) {
      const response = await api.get(`/api/recipes/${recipe._id}`)
        .set('Authorization', `Bearer ${tokenFor(user)}`).expect(200);
      expect(response.body.data).toMatchObject({
        isLocked: false, ingredients: ['authorized ingredient'], instructions: ['authorized instructions']
      });
    }
  });

  test('requires authentication and validates recipe creation fields', async () => {
    await api.post('/api/recipes').send({ title: 'No auth' }).expect(401);
    const user = makeUser(); await seedUser(user);
    const invalid = await api.post('/api/recipes').set('Authorization', `Bearer ${tokenFor(user)}`).send({ title: 'Incomplete' }).expect(400);
    expect(invalid.body.message).toMatch(/required/i);
  });

  test('creates recipes for authenticated users and initializes engagement fields', async () => {
    const user = makeUser(); await seedUser(user);
    const response = await api.post('/api/recipes').set('Authorization', `Bearer ${tokenFor(user)}`).send({
      recipeName: 'New Soup', recipeImage: 'https://example.test/new-soup.jpg',
      category: 'Dinner', cuisineType: 'South Asian', difficultyLevel: 'Easy',
      ingredients: ['lentils'], instructions: ['Cook'], preparationTime: 20
    }).expect(201);
    expect(response.body.success).toBe(true);
    const saved = await getCollection('recipes').findOne({ authorEmail: user.email });
    expect(saved).toMatchObject({ title: 'New Soup', image: 'https://example.test/new-soup.jpg', cuisineType: 'South Asian', difficultyLevel: 'Easy', cookingTime: 20, likes: [], likesCount: 0 });
  });

  test('updates and deletes an owned recipe using the client field names', async () => {
    const user = makeUser(); await seedUser(user);
    const recipe = await seedRecipe({ authorEmail: user.email, authorName: user.name });
    const token = tokenFor(user);
    await api.put(`/api/recipes/${recipe._id}`).set('Authorization', `Bearer ${token}`).send({
      recipeName: 'Updated Soup', recipeImage: 'https://example.test/updated.jpg', preparationTime: 45
    }).expect(200);
    const updated = await getCollection('recipes').findOne({ _id: recipe._id });
    expect(updated).toMatchObject({ title: 'Updated Soup', image: 'https://example.test/updated.jpg', cookingTime: 45 });
    await api.delete(`/api/recipes/${recipe._id}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(await getCollection('recipes').findOne({ _id: recipe._id })).toBeNull();
  });

  test('returns recipe detail compatibility fields and locks premium instructions publicly', async () => {
    const recipe = await seedRecipe({ title: 'Paid Recipe', isPremium: true });
    const response = await api.get(`/api/recipes/${recipe._id}`).expect(200);
    expect(response.body.data).toMatchObject({ recipeName: 'Paid Recipe', isLocked: true });
    expect(response.body.data).not.toHaveProperty('instructions');
  });

  test('lists reviews publicly without reviewer identifiers and computes average/count', async () => {
    const recipe = await seedRecipe({ reviews: [
      { userId: 'private-id', userEmail: 'private@example.test', userName: 'One', rating: 4, comment: 'Good' },
      { userId: 'another-id', userEmail: 'other@example.test', userName: 'Two', rating: 2, comment: 'Okay' }
    ] });
    const response = await api.get(`/api/recipes/${recipe._id}/reviews`).expect(200);
    expect(response.body).toMatchObject({ averageRating: 3, reviewCount: 2 });
    expect(response.body.reviews[0]).not.toHaveProperty('userId');
    expect(response.body.reviews[0]).not.toHaveProperty('userEmail');
  });

  test('requires auth, validates review input, and allows one editable review per user', async () => {
    const user = makeUser(); await seedUser(user);
    const recipe = await seedRecipe();
    const route = `/api/recipes/${recipe._id}/reviews`;
    const token = tokenFor(user);
    await api.put(route).send({ rating: 5, comment: 'Good' }).expect(401);
    await api.put(route).set('Authorization', `Bearer ${token}`).send({ rating: 6, comment: 'Good' }).expect(400);
    await api.put(route).set('Authorization', `Bearer ${token}`).send({ rating: 4, comment: '  ' }).expect(400);
    await api.put(route).set('Authorization', `Bearer ${token}`).send({ rating: 5, comment: 'First review' }).expect(200);
    await api.put(route).set('Cookie', `token=${token}`).send({ rating: 3, comment: 'Edited review' }).expect(200);
    const saved = await getCollection('recipes').findOne({ _id: recipe._id });
    expect(saved.reviews).toHaveLength(1);
    expect(saved.reviews[0]).toMatchObject({ userId: user.id, rating: 3, comment: 'Edited review' });
  });
});

describe('likes, favorites, reports and admin', () => {
  test('authenticates likes and persists the updated count', async () => {
    const user = makeUser(); await seedUser(user); const recipe = await seedRecipe();
    await api.post(`/api/recipes/${recipe._id}/like`).expect(401);
    await api.post(`/api/recipes/${recipe._id}/like`).set('Authorization', `Bearer ${tokenFor(user)}`).expect(200);
    expect((await getCollection('recipes').findOne({ _id: recipe._id })).likesCount).toBe(1);
  });

  test('adds and removes a user favorite', async () => {
    const user = makeUser(); await seedUser(user); const recipe = await seedRecipe(); const token = tokenFor(user);
    await api.post('/api/favorites').set('Authorization', `Bearer ${token}`).send({ recipeId: recipe._id.toString() }).expect(201);
    expect(await getCollection('favorites').countDocuments({ userId: user.id })).toBe(1);
    await api.delete(`/api/favorites/${recipe._id}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(await getCollection('favorites').countDocuments({ userId: user.id })).toBe(0);
  });

  test('validates and records protected recipe reports', async () => {
    const user = makeUser(); await seedUser(user); const recipe = await seedRecipe(); const token = tokenFor(user);
    const route = `/api/recipes/${recipe._id}/report`;
    await api.post(route).send({ reason: 'Spam' }).expect(401);
    await api.post(route).set('Authorization', `Bearer ${token}`).send({ reason: 'Other' }).expect(400);
    await api.post(route).set('Authorization', `Bearer ${token}`).send({ reason: 'Spam' }).expect(200);
    expect(await getCollection('reports').countDocuments({ recipeId: recipe._id, reporterEmail: user.email })).toBe(1);
  });

  test('protects admin endpoints and supports admin role management', async () => {
    const user = makeUser(); const admin = makeUser({ role: 'admin' });
    await seedUser(user); await seedUser(admin);
    await api.get('/api/admin/stats').expect(401);
    await api.get('/api/admin/stats').set('Authorization', `Bearer ${tokenFor(user)}`).expect(403);
    expect((await api.get('/api/admin/stats').set('Authorization', `Bearer ${tokenFor(admin)}`).expect(200)).body.success).toBe(true);
    await api.patch(`/api/admin/users/${user.id}/role`).set('Authorization', `Bearer ${tokenFor(admin)}`).send({ role: 'admin' }).expect(200);
    expect((await getCollection('users').findOne({ _id: (await import('mongodb')).ObjectId.createFromHexString(user.id) })).role).toBe('admin');
  });
});

describe('payment boundary', () => {
  test('validates checkout type without creating a Stripe session or transaction', async () => {
    const user = makeUser(); await seedUser(user);
    const response = await api.post('/api/create-checkout-session').set('Authorization', `Bearer ${tokenFor(user)}`).send({ type: 'unsupported' }).expect(400);
    expect(response.body.message).toMatch(/payment type/i);
    expect(await getCollection('payments').countDocuments()).toBe(0);
  });

  test('validates missing payment verification input without contacting Stripe', async () => {
    const user = makeUser(); await seedUser(user);
    const response = await api.post('/api/payments/verify').set('Authorization', `Bearer ${tokenFor(user)}`).send({}).expect(400);
    expect(response.body.success).toBe(false);
  });

  test('deduplicates signed Stripe webhook deliveries when payment_intent is absent', async () => {
    const user = makeUser(); await seedUser(user);
    const recipe = await seedRecipe();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = {
      id: 'cs_test_no_payment_intent',
      object: 'checkout.session',
      payment_intent: null,
      payment_status: 'paid',
      amount_total: 500,
      currency: 'usd',
      metadata: {
        userId: user.id,
        userEmail: user.email,
        recipeId: recipe._id.toString(),
        paymentType: 'recipe'
      }
    };
    const payload = JSON.stringify({
      id: 'evt_test_duplicate_delivery',
      object: 'event',
      api_version: '2025-03-31.basil',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 1,
      type: 'checkout.session.completed',
      data: { object: session }
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET
    });

    const deliver = () => api.post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload);
    const duplicateDeliveries = await Promise.all([deliver(), deliver()]);
    duplicateDeliveries.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });
    });

    expect(await getCollection('payments').countDocuments({ checkoutSessionId: session.id })).toBe(1);
    const payment = await getCollection('payments').findOne({ checkoutSessionId: session.id });
    expect(payment).toMatchObject({
      stripeEventId: 'evt_test_duplicate_delivery',
      transactionId: session.id,
      userId: user.id,
      recipeId: recipe._id,
      status: 'succeeded'
    });
  });
});
