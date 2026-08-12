# 🍽️ RecipeHub

> A full-stack community-driven recipe sharing and management platform built with the MERN Stack.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Stripe](https://img.shields.io/badge/Stripe-Payments-purple)

---

## 📖 Overview

RecipeHub is a modern recipe sharing platform where users can publish recipes, discover dishes from the community, save favorites, purchase premium membership, and interact through likes and reports.

The project was developed as part of the **Web Programming Lab** course to demonstrate modern full-stack web development using the MERN Stack.

---

## 🌐 Live Demo
The application will be deployed after development is completed.

Frontend:https://recipehub-client-delta.vercel.app


Backend API:https://recipehub-server-dr3a.onrender.com


---

## ✨ Main Features

### Authentication

- Email & Password Login
- Google Authentication
- JWT Authentication
- HTTPOnly Cookie Sessions
- Protected Routes

### Recipe Management

- Create Recipe
- Update Recipe
- Delete Recipe
- Browse Recipes
- Recipe Details
- Search & Filter
- Pagination

### User Features

- Favorites
- Recipe Likes
- Recipe Reports
- Purchased Recipes
- Profile Management
- Dark / Light Mode

### Premium Features

- Unlimited Recipe Upload
- Premium Badge
- Stripe Checkout Integration

### Admin Features

- Dashboard
- Manage Users
- Manage Recipes
- Feature Recipes
- Remove Recipes
- Handle Reports
- View Transactions

---

# 🛠 Tech Stack

## Frontend

- Next.js
- React
- Tailwind CSS
- Framer Motion
- Axios

## Backend

- Node.js
- Express.js
- MongoDB Atlas
- JWT
- Better Auth
- Stripe
- ImgBB API

---

# 📂 Project Structure

```
recipehub-project/

│

├── recipehub-client/

└── recipehub-server/
```

---

# ⚙️ Installation

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Run Client

```bash
npm run dev
```

Run Server

```bash
npm run dev
```

---

# 🔐 Environment Variables

### Client

```
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_IMGBB_API_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Server

```
PORT=
MONGODB_URI=
JWT_SECRET=

CLIENT_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

STRIPE_SECRET_KEY=
IMGBB_API_KEY=
```

---

# 📦 Database Collections

- users
- recipes
- favorites
- reports
- payments

---

# 🚀 Future Improvements

- AI Recipe Recommendation
- Nutrition Information
- Ratings & Reviews
- Meal Planning
- Mobile Application

---

# 👥 Team

**Team Name:** DevDynasty

### Sadia Rahman

- Backend Development
- Authentication
- Database Design
- Payment Integration
- Deployment

### Tabassum Zaman

- Frontend Development
- UI Components
- Responsive Design
- Dashboard Pages

---

# 📄 Documentation

Project documentation is available inside the repository.

- README.md
- TASK.md
- WORKFLOW.md
- IMPLEMENTATION-PLAN.md

---

## 📜 License

This project was developed for educational purposes as part of the Web Programming Lab course at Metropolitan University.