import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { connectDB, getCollection } from './db.js';
import { auth } from "./auth.js";
import { verifyToken } from './jwtMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

app.use(express.json());
app.use(cookieParser());

// ==========================================
// 2. MONGODB DATABASE CONNECTION MIDDLEWARE
// ==========================================
app.use(async (req, res, next) => {
  try {
    await connectDB();
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

connectDB().then(() => {
  dbConnected = true;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Database connection failed. Server not started.", err);
  process.exit(1); // Exit if DB connection fails
});

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
// CREATE RECIPE (Protected)
app.post('/api/recipes', verifyToken, async (req, res) => {
  try {
    const { title, image, ingredients, instructions, category, cookingTime, isPremium } = req.body;

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
      isPremium: isPremium === true || isPremium === 'true',
      authorEmail: req.user.email,
      authorName: req.user.name || "Anonymous",
      likes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await recipesCollection.insertOne(newRecipe);

    return res.status(201).json({
      success: true,
      message: "Recipe created successfully",
      recipe: { ...newRecipe, _id: result.insertedId }
    });
  } catch (error) {
    console.error("Create recipe error:", error);
    return res.status(500).json({ success: false, message: "Failed to create recipe" });
  }
});
// GET ALL RECIPES (Public / Optional Auth for Filtering)
app.get('/api/recipes', getOptionalUser, async (req, res) => {
  try {
    const { category, search, authorEmail } = req.query;
    const query = {};

    if (category) {
      query.category = { $regex: category, $options: 'i' };
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
    const recipes = await recipesCollection.find(query).sort({ createdAt: -1 }).toArray();

    return res.json({
      success: true,
      count: recipes.length,
      recipes
    });
  } catch (error) {
    console.error("Get recipes error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch recipes" });
  }
});

// GET SINGLE RECIPE BY ID (Public / Optional Auth for Premium Content check)
app.get('/api/recipes/:id', getOptionalUser, async (req, res) => {
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

    return res.json({
      success: true,
      recipe
    });
  } catch (error) {
    console.error("Get single recipe error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch recipe" });
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

    const { title, image, ingredients, instructions, category, cookingTime, isPremium } = req.body;

    const updateFields = {
      updatedAt: new Date()
    };

    if (title) updateFields.title = title;
    if (image) updateFields.image = image;
    if (ingredients) updateFields.ingredients = Array.isArray(ingredients) ? ingredients : ingredients.split(',').map(i => i.trim());
    if (instructions) updateFields.instructions = Array.isArray(instructions) ? instructions : instructions.split('\n').map(i => i.trim());
    if (category) updateFields.category = category;
    if (cookingTime) updateFields.cookingTime = parseInt(cookingTime);
    if (isPremium !== undefined) updateFields.isPremium = isPremium === true || isPremium === 'true';

    await recipesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    const updatedRecipe = await recipesCollection.findOne({ _id: new ObjectId(id) });

    return res.json({
      success: true,
      message: "Recipe updated successfully",
      recipe: updatedRecipe
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

export default app;