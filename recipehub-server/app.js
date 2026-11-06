import express from 'express';
import cors from 'cors';
import { ObjectId } from 'mongodb';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { connectDB, getCollection } from './db.js';
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { verifyToken, getOptionalUser, verifyAdmin } from './jwtMiddleware.js'; // Added missing middleware
import Stripe from 'stripe';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

// ==========================================
// 1. EXPRESS & MIDDLEWARE SETUP
// ==========================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Mount Better Auth handler before the JSON parser.
app.all("/api/auth/*", (req, res, next) => {
  const customPaths = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/google-callback',
    '/api/auth/logout',
    '/api/auth/me',
    '/api/auth/stats',
    '/api/auth/profile'
  ];

  if (customPaths.includes(req.path)) {
    return next();
  }

  return toNodeHandler(auth)(req, res, next);
});

// ==========================================
// STRIPE WEBHOOK HANDLER (MUST BE BEFORE express.json())
// ==========================================
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook Signature Verification Failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, userEmail, paymentType } = session.metadata;

    try {
      const usersCollection = getCollection('users');

      await recordSuccessfulPayment(session, event.id);

      // Update user status if membership payment
      if (paymentType === 'membership') {
        await usersCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { isPremium: true, updatedAt: new Date() } }
        );
      }

      console.log(`Payment processed successfully for ${userEmail}`);
    } catch (dbError) {
      console.error("Failed to update database on Stripe Webhook:", dbError);
      return res.status(500).send("Database Update Failed");
    }
  }

  return res.json({ received: true });
});

// JSON Body Parser & Cookie Parser
app.use(express.json());
app.use(cookieParser());

// ==========================================
// 2. MONGODB DATABASE CONNECTION MIDDLEWARE
// ==========================================
app.use(async (req, res, next) => {
  try {
      await connectDB();
      dbConnected = true;
    next();
  } catch (err) {
    console.error("Database connection failed in middleware:", err);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// ==========================================
// 3. SERVER INITIALIZATION & BASIC ROUTES
// ==========================================
let dbConnected = false;

function normalizeRecipe(recipe) {
  const publicReviews = Array.isArray(recipe.reviews)
    ? recipe.reviews.map(sanitizePublicReview)
    : recipe.reviews;
  return {
    ...recipe,
    ...(publicReviews ? { reviews: publicReviews } : {}),
    recipeName: recipe.recipeName ?? recipe.title,
    recipeImage: recipe.recipeImage ?? recipe.image,
    preparationTime: recipe.preparationTime ?? recipe.cookingTime
  };
}

function sanitizePublicReview(review) {
  const publicReview = {};
  for (const field of ['userName', 'rating', 'comment', 'createdAt', 'updatedAt']) {
    if (review[field] !== undefined) publicReview[field] = review[field];
  }
  return publicReview;
}

async function serializePublicRecipes(recipes, req) {
  const premiumRecipes = recipes.filter(recipe => recipe.isPremium);
  let user = null;
  if (premiumRecipes.length) user = await getOptionalUser(req);

  const purchases = new Set();
  if (user && !user.isPremium && user.role !== 'admin' && premiumRecipes.length) {
    const purchased = await getCollection('payments').find({
      userId: user.id,
      recipeId: { $in: premiumRecipes.map(recipe => recipe._id) },
      status: 'succeeded'
    }, { projection: { recipeId: 1 } }).toArray();
    purchased.forEach(payment => purchases.add(payment.recipeId.toString()));
  }

  return recipes.map(recipe => {
    const hasAccess = !recipe.isPremium || Boolean(user && (
      recipe.authorEmail === user.email ||
      user.role === 'admin' ||
      user.isPremium ||
      purchases.has(recipe._id.toString())
    ));
    const normalized = normalizeRecipe(recipe);
    if (recipe.isPremium && !hasAccess) {
      const { ingredients, importantTopics, instructions, ...preview } = normalized;
      return { ...preview, isLocked: true };
    }
    return { ...normalized, isLocked: false };
  });
}

async function recordSuccessfulPayment(session, stripeEventId) {
  const checkoutSessionId = session.id;
  if (!checkoutSessionId) throw new Error('Stripe checkout session ID is required');

  const payments = getCollection('payments');
  const transactionId = session.payment_intent || checkoutSessionId;
  const existingBySession = await payments.findOne({ checkoutSessionId });
  if (existingBySession) return existingBySession;

  const existingByTransaction = await payments.findOne({ transactionId });
  if (existingByTransaction) {
    await payments.updateOne(
      { _id: existingByTransaction._id },
      { $set: { checkoutSessionId } }
    );
    return existingByTransaction;
  }

  try {
    await payments.updateOne({ checkoutSessionId }, { $setOnInsert: {
      checkoutSessionId,
      ...(stripeEventId ? { stripeEventId } : {}),
      userId: session.metadata.userId,
      userEmail: session.metadata.userEmail,
      recipeId: session.metadata.recipeId && ObjectId.isValid(session.metadata.recipeId)
        ? new ObjectId(session.metadata.recipeId)
        : null,
      paymentType: session.metadata.paymentType,
      transactionId,
      amount: session.amount_total / 100,
      currency: session.currency,
      status: 'succeeded',
      paidAt: new Date()
    } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000 || !(await payments.findOne({ checkoutSessionId }))) throw error;
  }
  return payments.findOne({ checkoutSessionId });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", database: dbConnected });
});

// Root endpoint
app.get('/', (req, res) => {
  if (process.env.CLIENT_URL) {
    return res.redirect(process.env.CLIENT_URL);
  }
  return res.json({ status: "ok", message: "RecipeHub Server API is running" });
});

// ==========================================
// 4. AUTHENTICATION ENDPOINTS
// ==========================================

// --- REGISTER ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, image, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    const usersCollection = getCollection("users");
    const existingUser = await usersCollection.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Sign up with Better Auth
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name,
        email: email.toLowerCase(),
        password,
        image: image || "https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=2048x2048&w=is&k=20&c=wMTCZdfcnfH8GFWojm54r2NRaHuoQZyv7JxrdQmchkc="
      }
    });

    if (!signUpResult?.user) {
      return res.status(500).json({
        success: false,
        message: "Signup failed"
      });
    }

    const finalRole = "user";

    await usersCollection.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          role: finalRole,
          isBlocked: false,
          isPremium: false,
          updatedAt: new Date()
        }
      }
    );

    const user = await usersCollection.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(500).json({
        success: false,
        message: "User created but not found in database"
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role || "user",
        isPremium: user.isPremium || false,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: "10d" }
    );

    // Set HTTPOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      maxAge: 10 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role || "user",
        isPremium: user.isPremium || false
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error?.body?.code === 'USER_ALREADY_EXISTS') {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed"
    });
  }
});

// --- LOGIN ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    const usersCollection = getCollection("users");
    const userCheck = await usersCollection.findOne({
      email: email.toLowerCase()
    });

    if (!userCheck) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email"
      });
    }

    if (userCheck.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by the administrator."
      });
    }

    await auth.api.signInEmail({
      body: {
        email: email.toLowerCase(),
        password
      }
    });

    const user = await usersCollection.findOne({
      email: email.toLowerCase()
    });

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role || "user",
        isPremium: user.isPremium || false,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: "10d" }
    );

    // Set HTTPOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      maxAge: 10 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role || "user",
        isPremium: user.isPremium || false
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    if (error?.statusCode === 401 || error?.body?.code === 'INVALID_EMAIL_OR_PASSWORD') {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
});

// --- GOOGLE OAUTH CALLBACK ---
app.post('/api/auth/google-callback', async (req, res) => {
  const { email, name, image } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const usersCollection = getCollection('users');
    let user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      const insertResult = await usersCollection.insertOne({
        name: name || "Google User",
        email: email.toLowerCase(),
        image: image || "https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=2048x2048&w=is&k=20&c=wMTCZdfcnfH8GFWojm54r2NRaHuoQZyv7JxrdQmchkc=",
        role: 'user',
        isBlocked: false,
        isPremium: false,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      user = await usersCollection.findOne({ _id: insertResult.insertedId });
    } else {
      if (user.role === undefined || user.isBlocked === undefined || user.isPremium === undefined) {
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              role: user.role || 'user',
              isBlocked: user.isBlocked ?? false,
              isPremium: user.isPremium ?? false,
              updatedAt: new Date()
            }
          }
        );
        user = await usersCollection.findOne({ _id: user._id });
      }
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Your account is blocked by the administrator." });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role || "user"
      },
      process.env.JWT_SECRET,
      { expiresIn: "10d" }
    );

    // Set HTTPOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: "Google Sign-in sync successful",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role || 'user',
        isPremium: user.isPremium || false
      }
    });

  } catch (error) {
    console.error("Google Callback Error:", error);
    return res.status(500).json({ success: false, message: "Failed to sync Google user credentials" });
  }
});

// --- LOGOUT (Clears HTTPOnly Cookie) ---
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  return res.json({ success: true, message: "Logged out successfully" });
});

// --- PROTECTED ROUTE (Using verifyToken middleware) ---
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const usersCollection = getCollection('users');
    const user = await usersCollection.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role || 'user',
        isPremium: user.isPremium || false
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get Logged-in User Stats Overview (Protected)
app.get('/api/auth/stats', verifyToken, async (req, res) => {
  try {
    const recipesCollection = getCollection('recipes');
    const favoritesCollection = getCollection('favorites');

    const totalRecipes = await recipesCollection.countDocuments({ authorEmail: req.user.email });
    const totalFavorites = await favoritesCollection.countDocuments({ userId: req.user.id });

    // Sum likesCount of all recipes authored by the user
    const recipes = await recipesCollection.find({ authorEmail: req.user.email }).toArray();
    const totalLikesReceived = recipes.reduce((sum, r) => sum + (r.likesCount || 0), 0);

    return res.json({
      success: true,
      data: {
        totalRecipes,
        totalFavorites,
        totalLikesReceived
      }
    });
  } catch (error) {
    console.error("User Stats Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch user stats overview" });
  }
});

// Update User Profile (Protected)
app.put('/api/auth/profile', verifyToken, async (req, res) => {
  const { name, image } = req.body;
  if (!name && !image) {
    return res.status(400).json({ success: false, message: "Please provide name or image to update" });
  }

  try {
    const usersCollection = getCollection('users');
    const updateDoc = { updatedAt: new Date() };
    if (name) updateDoc.name = name;
    if (image) updateDoc.image = image;

    const result = await usersCollection.updateOne(
      { email: req.user.email },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updatedUser = await usersCollection.findOne({ email: req.user.email });
    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        role: updatedUser.role || 'user',
        isPremium: updatedUser.isPremium || false
      }
    });

  } catch (error) {
    console.error("Profile Update Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

// ==========================================
// 5. RECIPE ENDPOINTS
// ==========================================

// CREATE RECIPE (Protected)
app.post('/api/recipes', verifyToken, async (req, res) => {
  try {
    const title = req.body.title ?? req.body.recipeName;
    const image = req.body.image ?? req.body.recipeImage;
    const ingredients = req.body.ingredients;
    const instructions = req.body.instructions;
    const category = req.body.category;
    const cookingTime = req.body.cookingTime ?? req.body.preparationTime;
    const { cuisineType, difficultyLevel, isPremium } = req.body;

    if (!title || !ingredients || !instructions || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, ingredients, instructions, and category are required"
      });
    }

    const recipesCollection = getCollection('recipes');

    const newRecipe = {
      title,
      image: image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=800",
      ingredients: Array.isArray(ingredients) ? ingredients : ingredients.split(',').map(i => i.trim()),
      instructions: Array.isArray(instructions) ? instructions : instructions.split('\n').map(i => i.trim()),
      category,
      cookingTime: parseInt(cookingTime) || 30,
      cuisineType,
      difficultyLevel,
      isPremium: isPremium === true || isPremium === 'true',
      authorEmail: req.user.email,
      authorName: req.user.name || "Anonymous",
      likes: [],
      likesCount: 0,
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await recipesCollection.insertOne(newRecipe);

    return res.status(201).json({
      success: true,
      message: "Recipe created successfully",
      recipe: normalizeRecipe({ ...newRecipe, _id: result.insertedId })
    });
  } catch (error) {
    console.error("Create recipe error:", error);
    return res.status(500).json({ success: false, message: "Failed to create recipe" });
  }
});

// GET ALL RECIPES (Public)
app.get('/api/recipes', async (req, res) => {
  try {
    const { category, search, authorEmail } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
    const query = {};

    if (category) {
      const categories = String(category).split(',').map(value => value.trim()).filter(Boolean);
      if (categories.length) query.category = { $in: categories.map(value => new RegExp(value, 'i')) };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (authorEmail) {
      query.authorEmail = authorEmail;
    }

    const recipesCollection = getCollection('recipes');
    const totalRecipes = await recipesCollection.countDocuments(query);
    const limit = hasPagination ? Math.min(50, Math.max(1, requestedLimit || 12)) : Math.max(totalRecipes, 1);
    const recipes = await recipesCollection.find(query).sort({ createdAt: -1, _id: -1 })
      .skip(hasPagination ? (page - 1) * limit : 0).limit(limit).toArray();
    const publicRecipes = await serializePublicRecipes(recipes, req);

    return res.json({
      success: true,
      count: recipes.length,
      recipes: publicRecipes,
      data: publicRecipes,
      pagination: { totalRecipes, page, limit, totalPages: Math.ceil(totalRecipes / limit) }
    });
  } catch (error) {
    console.error("Get recipes error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch recipes" });
  }
});

app.get('/api/recipes/featured', async (req, res) => {
  try {
    const recipes = await getCollection('recipes').find({ isFeatured: true, status: 'published' })
      .sort({ createdAt: -1 }).limit(6).toArray();
    return res.json({ success: true, data: await serializePublicRecipes(recipes, req) });
  } catch (error) {
    console.error('Get featured recipes error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch featured recipes' });
  }
});

app.get('/api/recipes/popular', async (req, res) => {
  try {
    const recipes = await getCollection('recipes').find({ status: 'published' })
      .sort({ likesCount: -1, createdAt: -1 }).limit(6).toArray();
    return res.json({ success: true, data: await serializePublicRecipes(recipes, req) });
  } catch (error) {
    console.error('Get popular recipes error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch popular recipes' });
  }
});

// GET SINGLE RECIPE BY ID (Public)
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid recipe ID" });
    }

    const recipesCollection = getCollection('recipes');
    const recipe = await recipesCollection.findOne({ _id: new ObjectId(id) });

    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    const [data] = await serializePublicRecipes([recipe], req);
    return res.json({ success: true, recipe: data, data });
  } catch (error) {
    console.error("Get single recipe error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch recipe" });
  }
});

// GET RECIPE REVIEWS (Public)
app.get('/api/recipes/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid recipe ID" });
    }

    const recipe = await getCollection('recipes').findOne(
      { _id: new ObjectId(id) },
      { projection: { reviews: 1 } }
    );
    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    const reviews = recipe.reviews || [];
    const ratingTotal = reviews.reduce((total, review) => total + review.rating, 0);
    const currentUser = await getOptionalUser(req);

    return res.json({
      success: true,
      reviews: reviews.map(review => ({
        ...sanitizePublicReview(review),
        isOwnReview: review.userId === currentUser?.id
      })),
      averageRating: reviews.length ? Number((ratingTotal / reviews.length).toFixed(1)) : 0,
      reviewCount: reviews.length
    });
  } catch (error) {
    console.error("Get recipe reviews error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
});

// CREATE OR UPDATE THE AUTHENTICATED USER'S RECIPE REVIEW
app.put('/api/recipes/:id/reviews', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const normalizedComment = typeof comment === 'string' ? comment.trim() : '';

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid recipe ID" });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be a whole number from 1 to 5" });
    }
    if (!normalizedComment || normalizedComment.length > 1000) {
      return res.status(400).json({ success: false, message: "Review comment must be between 1 and 1000 characters" });
    }

    const recipesCollection = getCollection('recipes');
    const recipeId = new ObjectId(id);
    const recipe = await recipesCollection.findOne({ _id: recipeId }, { projection: { _id: 1 } });
    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    const now = new Date();
    const existingReview = await recipesCollection.findOne(
      { _id: recipeId, "reviews.userId": req.user.id },
      { projection: { _id: 1 } }
    );

    if (existingReview) {
      await recipesCollection.updateOne(
        { _id: recipeId, "reviews.userId": req.user.id },
        { $set: {
          "reviews.$.rating": rating,
          "reviews.$.comment": normalizedComment,
          "reviews.$.updatedAt": now
        } }
      );
    } else {
      const result = await recipesCollection.updateOne(
        { _id: recipeId, $nor: [{ "reviews.userId": req.user.id }] },
        { $push: { reviews: {
          userId: req.user.id,
          userName: req.user.name || "Anonymous",
          rating,
          comment: normalizedComment,
          createdAt: now,
          updatedAt: now
        } } }
      );

      if (!result.modifiedCount) {
        return res.status(409).json({ success: false, message: "A review already exists for this user and recipe. Refresh and edit it." });
      }
    }

    return res.json({ success: true, message: "Review saved successfully" });
  } catch (error) {
    console.error("Save recipe review error:", error);
    return res.status(500).json({ success: false, message: "Failed to save review" });
  }
});

// UPDATE RECIPE (Protected - Author or Admin)
app.put('/api/recipes/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid recipe ID" });
    }

    const recipesCollection = getCollection('recipes');
    const recipe = await recipesCollection.findOne({ _id: new ObjectId(id) });

    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    // Check ownership or admin status
    if (recipe.authorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized to update this recipe" });
    }

    const title = req.body.title ?? req.body.recipeName;
    const image = req.body.image ?? req.body.recipeImage;
    const ingredients = req.body.ingredients;
    const instructions = req.body.instructions;
    const category = req.body.category;
    const cookingTime = req.body.cookingTime ?? req.body.preparationTime;
    const { cuisineType, difficultyLevel, isPremium } = req.body;

    const updateFields = {
      updatedAt: new Date()
    };

    if (title) updateFields.title = title;
    if (image) updateFields.image = image;
    if (ingredients) updateFields.ingredients = Array.isArray(ingredients) ? ingredients : ingredients.split(',').map(i => i.trim());
    if (instructions) updateFields.instructions = Array.isArray(instructions) ? instructions : instructions.split('\n').map(i => i.trim());
    if (category) updateFields.category = category;
    if (cookingTime) updateFields.cookingTime = parseInt(cookingTime);
    if (cuisineType !== undefined) updateFields.cuisineType = cuisineType;
    if (difficultyLevel !== undefined) updateFields.difficultyLevel = difficultyLevel;
    if (isPremium !== undefined) updateFields.isPremium = isPremium === true || isPremium === 'true';

    await recipesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    const updatedRecipe = await recipesCollection.findOne({ _id: new ObjectId(id) });

    return res.json({
      success: true,
      message: "Recipe updated successfully",
      recipe: normalizeRecipe(updatedRecipe)
    });
  } catch (error) {
    console.error("Update recipe error:", error);
    return res.status(500).json({ success: false, message: "Failed to update recipe" });
  }
});

// DELETE RECIPE (Protected - Author or Admin)
app.delete('/api/recipes/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid recipe ID" });
    }

    const recipesCollection = getCollection('recipes');
    const recipe = await recipesCollection.findOne({ _id: new ObjectId(id) });

    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    // Check ownership or admin status
    if (recipe.authorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this recipe" });
    }

    await recipesCollection.deleteOne({ _id: new ObjectId(id) });

    return res.json({
      success: true,
      message: "Recipe deleted successfully"
    });
  } catch (error) {
    console.error("Delete recipe error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete recipe" });
  }
});

// TOGGLE LIKE / UNLIKE RECIPE (Protected)
app.post('/api/recipes/:id/like', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid recipe ID" });
    }

    const recipesCollection = getCollection('recipes');
    const recipe = await recipesCollection.findOne({ _id: new ObjectId(id) });

    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    const likesArray = recipe.likes || [];
    const hasLiked = likesArray.includes(req.user.email);

    let updateDoc;
    if (hasLiked) {
      // Remove Like
      updateDoc = {
        $pull: { likes: req.user.email },
        $inc: { likesCount: -1 }
      };
    } else {
      // Add Like
      updateDoc = {
        $addToSet: { likes: req.user.email },
        $inc: { likesCount: 1 }
      };
    }

    await recipesCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);
    const updatedRecipe = await recipesCollection.findOne({ _id: new ObjectId(id) });

    return res.json({
      success: true,
      liked: !hasLiked,
      likesCount: updatedRecipe.likesCount || 0
    });

  } catch (error) {
    console.error("Like Recipe Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update like status" });
  }
});

app.post('/api/recipes/:id/report', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid recipe ID' });
  if (!['Spam', 'Offensive Content', 'Copyright Issue'].includes(reason)) {
    return res.status(400).json({ success: false, message: 'Valid reason is required (Spam, Offensive Content, Copyright Issue)' });
  }
  try {
    const recipe = await getCollection('recipes').findOne({ _id: new ObjectId(id) });
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    await getCollection('reports').insertOne({
      recipeId: new ObjectId(id), reporterEmail: req.user.email, reason,
      status: 'pending', createdAt: new Date()
    });
    return res.json({ success: true, message: 'Recipe reported successfully' });
  } catch (error) {
    console.error('Report recipe error:', error);
    return res.status(500).json({ success: false, message: 'Failed to report recipe' });
  }
});

// ==========================================
// 6. FAVORITES ENDPOINTS
// ==========================================

// List Favorite Recipes (Protected)
app.get('/api/favorites', verifyToken, async (req, res) => {
  try {
    const favoritesCollection = getCollection('favorites');
    const favorites = await favoritesCollection.aggregate([
      { $match: { userId: req.user.id } },
      {
        $lookup: {
          from: 'recipes',
          localField: 'recipeId',
          foreignField: '_id',
          as: 'recipeDetails'
        }
      },
      { $unwind: '$recipeDetails' },
      {
        $project: {
          _id: 1,
          addedAt: 1,
          recipeId: '$recipeDetails._id',
      recipeName: { $ifNull: ['$recipeDetails.recipeName', '$recipeDetails.title'] },
          recipeImage: { $ifNull: ['$recipeDetails.recipeImage', '$recipeDetails.image'] },
          category: '$recipeDetails.category',
          preparationTime: { $ifNull: ['$recipeDetails.preparationTime', '$recipeDetails.cookingTime'] },
          authorName: '$recipeDetails.authorName'
        }
      }
    ]).toArray();

    return res.json({ success: true, data: favorites });

  } catch (error) {
    console.error("Get Favorites Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch favorites" });
  }
});

// Add Recipe to Favorites (Protected)
app.post('/api/favorites', verifyToken, async (req, res) => {
  const { recipeId } = req.body;
  if (!recipeId) {
    return res.status(400).json({ success: false, message: "Recipe ID is required" });
  }

  try {
    const favoritesCollection = getCollection('favorites');

    // Check if already in favorites
    const existing = await favoritesCollection.findOne({
      userId: req.user.id,
      recipeId: new ObjectId(recipeId)
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Recipe is already in your favorites list" });
    }

    const newFavorite = {
      userEmail: req.user.email,
      userId: req.user.id,
      recipeId: new ObjectId(recipeId),
      addedAt: new Date()
    };

    await favoritesCollection.insertOne(newFavorite);
    return res.status(201).json({ success: true, message: "Added to favorites" });

  } catch (error) {
    console.error("Add Favorite Error:", error);
    return res.status(500).json({ success: false, message: "Failed to add to favorites" });
  }
});

// Remove Recipe from Favorites (Protected)
app.delete('/api/favorites/:recipeId', verifyToken, async (req, res) => {
  const { recipeId } = req.params;
  try {
    const favoritesCollection = getCollection('favorites');
    const result = await favoritesCollection.deleteOne({
      userId: req.user.id,
      recipeId: new ObjectId(recipeId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Favorite recipe not found" });
    }

    return res.json({ success: true, message: "Removed from favorites" });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to remove from favorites" });
  }
});

// ==========================================
// 7. PAYMENTS & TRANSACTIONS ENDPOINTS
// ==========================================

// List Purchased Recipes for current user
app.get('/api/payments/purchased', verifyToken, async (req, res) => {
  try {
    const paymentsCollection = getCollection('payments');
    const purchases = await paymentsCollection.aggregate([
      {
        $match: {
          userId: req.user.id,
          recipeId: { $ne: null },
          status: 'succeeded'
        }
      },
      {
        $lookup: {
          from: 'recipes',
          localField: 'recipeId',
          foreignField: '_id',
          as: 'recipeDetails'
        }
      },
      { $unwind: '$recipeDetails' },
      {
        $project: {
          _id: 1,
          paidAt: 1,
          amount: 1,
          transactionId: 1,
          recipeId: '$recipeDetails._id',
          recipeName: { $ifNull: ['$recipeDetails.recipeName', '$recipeDetails.title'] },
          recipeImage: { $ifNull: ['$recipeDetails.recipeImage', '$recipeDetails.image'] },
          category: '$recipeDetails.category',
          cookingTime: { $ifNull: ['$recipeDetails.preparationTime', '$recipeDetails.cookingTime'] },
          preparationTime: { $ifNull: ['$recipeDetails.preparationTime', '$recipeDetails.cookingTime'] },
          authorName: '$recipeDetails.authorName'
        }
      }
    ]).toArray();

    return res.json({ success: true, data: purchases });

  } catch (error) {
    console.error("Get Purchased Recipes Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch purchased recipes" });
  }
});

// CREATE STRIPE CHECKOUT SESSION
app.post(['/api/payments/create-checkout-session', '/api/create-checkout-session'], verifyToken, async (req, res) => {
  const { recipeId } = req.body;
  const requestedType = req.body.paymentType ?? req.body.type;
  const paymentType = requestedType === 'premium' ? 'membership' : requestedType;

  try {
    let sessionConfig = {};

    if (paymentType === 'recipe') {
      if (!recipeId || !ObjectId.isValid(recipeId)) {
        return res.status(400).json({ success: false, message: "Valid Recipe ID required for recipe purchase" });
      }

      const recipesCollection = getCollection('recipes');
      const recipe = await recipesCollection.findOne({ _id: new ObjectId(recipeId) });

      if (!recipe) {
        return res.status(404).json({ success: false, message: "Recipe not found" });
      }

      sessionConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: recipe.title || 'Premium Recipe Access',
                images: recipe.image ? [recipe.image] : [],
                description: `Unlock full access to ${recipe.title}`
              },
              unit_amount: 500 // $5.00 USD
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        metadata: {
          userId: req.user.id,
          userEmail: req.user.email,
          recipeId: recipeId.toString(),
          paymentType: 'recipe'
        },
        success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/payment-cancel`
      };

    } else if (paymentType === 'membership') {
      sessionConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'RecipeHub Premium Membership',
                description: 'Unlimited access to all premium recipes and features'
              },
              unit_amount: 1999 // $19.99 USD
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        metadata: {
          userId: req.user.id,
          userEmail: req.user.email,
          paymentType: 'membership'
        },
        success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/payment-cancel`
      };
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment type" });
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error("Stripe Checkout Session Error:", error);
    return res.status(500).json({ success: false, message: "Failed to initialize payment session" });
  }
});

app.post('/api/payments/verify', verifyToken, async (req, res) => {
  const { sessionId } = req.body;
  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    return res.status(400).json({ success: false, message: 'Payment session ID is required' });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'This payment session does not belong to your account' });
    }
    if (session.payment_status !== 'paid') {
      return res.status(409).json({ success: false, message: 'Payment has not been completed' });
    }

    const { userId, paymentType } = session.metadata;
    await recordSuccessfulPayment(session);
    if (paymentType === 'membership') {
      await getCollection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { isPremium: true, updatedAt: new Date() } }
      );
    }
    return res.json({ success: true, message: 'Payment successfully processed!', data: {
      paymentType, recipeId: recipeId || null, amount: session.amount_total / 100, currency: session.currency
    } });
  } catch (error) {
    console.error('Stripe payment verification error:', error);
    return res.status(400).json({ success: false, message: 'Unable to verify payment session' });
  }
});

// ==========================================
// 8. ADMIN MANAGEMENT ENDPOINTS
// ==========================================

// ADMIN: GET ALL USERS (Admin Protected)
// Get Admin Overview Stats (Protected)
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
  try {
    const usersCollection = getCollection('users');
    const recipesCollection = getCollection('recipes');
    const reportsCollection = getCollection('reports');

    const totalUsers = await usersCollection.countDocuments();
    const totalRecipes = await recipesCollection.countDocuments();
    const totalPremiumMembers = await usersCollection.countDocuments({ isPremium: true });
    const totalReports = await reportsCollection.countDocuments();

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalRecipes,
        totalPremiumMembers,
        totalReports
      }
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch admin stats" });
  }
});

app.get('/api/admin/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const usersCollection = getCollection('users');
    const users = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();

    return res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error("Fetch Admin Users Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

app.put('/api/admin/users/:id/block', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const usersCollection = getCollection('users');
    const userToBlock = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (userToBlock?.email === req.user.email) {
      return res.status(400).json({ success: false, message: "You cannot block yourself!" });
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isBlocked: true, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, message: "User successfully blocked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to block user" });
  }
});

app.put('/api/admin/users/:id/unblock', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const usersCollection = getCollection('users');
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { isBlocked: false, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, message: "User successfully unblocked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to unblock user" });
  }
});

// ADMIN: BLOCK / UNBLOCK USER (Admin Protected)
app.patch('/api/admin/users/:id/block', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const usersCollection = getCollection('users');
    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isBlocked: !!isBlocked, updatedAt: new Date() } }
    );

    return res.json({
      success: true,
      message: `User status updated to ${isBlocked ? 'Blocked' : 'Active'}`
    });
  } catch (error) {
    console.error("Block User Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update user block status" });
  }
});

// ADMIN: CHANGE USER ROLE (Admin Protected)
app.patch('/api/admin/users/:id/role', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    const usersCollection = getCollection('users');
    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role, updatedAt: new Date() } }
    );

    return res.json({
      success: true,
      message: `User role updated to ${role}`
    });
  } catch (error) {
    console.error("Change Role Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update user role" });
  }
});

app.get('/api/admin/recipes', verifyAdmin, async (req, res) => {
  try {
    const recipes = await getCollection('recipes').find().toArray();
    return res.json({ success: true, data: recipes.map(normalizeRecipe) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch recipes" });
  }
});

app.put('/api/admin/recipes/:id/feature', verifyAdmin, async (req, res) => {
  try {
    const result = await getCollection('recipes').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { isFeatured: !!req.body.isFeatured, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    return res.json({ success: true, message: req.body.isFeatured ? "Recipe added to featured section" : "Recipe removed from featured section" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to feature recipe" });
  }
});

app.delete('/api/admin/recipes/:id', verifyAdmin, async (req, res) => {
  try {
    const recipeId = new ObjectId(req.params.id);
    const result = await getCollection('recipes').deleteOne({ _id: recipeId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    await getCollection('reports').deleteMany({ recipeId });
    return res.json({ success: true, message: "Recipe successfully deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete recipe" });
  }
});

app.get('/api/admin/reports', verifyAdmin, async (req, res) => {
  try {
    const reports = await getCollection('reports').aggregate([
      { $lookup: { from: 'recipes', localField: 'recipeId', foreignField: '_id', as: 'recipeDetails' } },
      { $unwind: '$recipeDetails' },
      {
        $project: {
          _id: 1, recipeId: 1, reporterEmail: 1, reason: 1, status: 1, createdAt: 1,
          recipeName: { $ifNull: ['$recipeDetails.recipeName', '$recipeDetails.title'] },
          recipeAuthor: '$recipeDetails.authorName',
          recipeAuthorEmail: '$recipeDetails.authorEmail'
        }
      }
    ]).toArray();
    return res.json({ success: true, data: reports });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch reports" });
  }
});

app.put('/api/admin/reports/:id/dismiss', verifyAdmin, async (req, res) => {
  try {
    const result = await getCollection('reports').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }
    return res.json({ success: true, message: "Report successfully dismissed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to dismiss report" });
  }
});

app.get('/api/admin/transactions', verifyAdmin, async (req, res) => {
  try {
    const transactions = await getCollection('payments').find().sort({ paidAt: -1 }).toArray();
    return res.json({ success: true, data: transactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
});

export default app;
