# RecipeHub

RecipeHub is a full-stack recipe sharing application developed for the CSE 300 Web Programming course at Metropolitan University. It lets visitors discover recipes, members publish and review recipes, premium members unlock premium content, and administrators manage platform activity.

## Purpose

The project demonstrates a complete web application using a React and Next.js interface, an Express API, MongoDB persistence, authentication and authorization, image hosting, payment processing, automated tests, and project documentation.

## Features

- Browse, search, and filter recipes with pagination, featured and popular collections, and detailed recipe pages.
- Register, sign in with email/password or Google, manage a profile, and use authenticated dashboards.
- Create, edit, and delete recipes; like recipes; save and remove favorites; and submit reports.
- Rate a recipe from 1 to 5 stars and leave a written review. Each authenticated user has one review per recipe and can edit it. Public review responses omit reviewer email and ID.
- Unlock premium recipes or purchase premium membership through Stripe Checkout.
- Use administrative pages for platform statistics, user management, recipe management, featured recipes, reports, and transactions.
- Upload recipe images through ImgBB; use responsive layouts and light/dark themes.

## User roles

- **Visitor:** browse recipes and public reviews; sign in to use protected actions.
- **Member:** manage a profile, publish recipes, and use likes, favorites, reports, and reviews.
- **Premium member:** access premium account features and content according to payment or ownership status.
- **Administrator:** access protected user, recipe, report, feature, and transaction management functions.

## Technology and architecture

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, Framer Motion, Lucide React.
- **Backend:** Node.js, Express 4, native MongoDB Node.js driver, Better Auth, custom JWT middleware, and Stripe SDK.
- **External services:** Stripe for payments and ImgBB for image hosting.

The Next.js application calls the Express API. Better Auth handles its authentication integration, including Google sign-in. The application’s custom registration and login handlers issue JWTs; custom JWT middleware authenticates API requests, and admin middleware checks administrator roles. These mechanisms have separate responsibilities. The backend supports HTTPOnly JWT cookies as well as the bearer-token flow used by the client.

The backend uses the native MongoDB driver; it does not use Mongoose. The main collections are `users`, `recipes`, `favorites`, `payments`, `reports`, and `sessions`. Ratings and reviews are embedded in each recipe document; they are not stored in a separate reviews collection.

See the [ER diagram](documentation/01-ER-Diagram/RecipeHub_MongoDB_ERD.png) and [system architecture diagram](documentation/02-System-Architecture/RecipeHub_Architecture.png).

## Ratings and reviews

The recipe detail page displays review text, an average rating, and the total review count. Signed-in users can submit or edit a whole-number rating from 1 to 5 with a comment. Signed-out visitors see a sign-in prompt. Review responses exclude reviewer email addresses and IDs.

## Premium payments and administration

Stripe Checkout supports one-time premium recipe purchases and premium membership. The server verifies payment sessions and processes Stripe webhooks; it records successful payments and updates membership status. Automated tests validate request boundaries without creating checkout sessions or making real transactions.

Admin-only API middleware protects user, recipe, report, feature, and transaction operations. The server also retains user role management and account blocking controls.

## Screenshots and supporting documents

Screenshots are existing documentation captures; they do not establish that the current deployment is live.

- [Home](documentation/03-Application-Screenshots/01-Home.png)
- [Recipe browsing](documentation/03-Application-Screenshots/02-Recipe-Browsing.png)
- [Recipe details and reviews](documentation/03-Application-Screenshots/03.1-Recipe-Details-Reviews.png)
- [Login](documentation/03-Application-Screenshots/04.0-Login.png) and [registration](documentation/03-Application-Screenshots/04.1-Register.png)
- [User recipe dashboard](documentation/03-Application-Screenshots/05-Add-Recipe-User-Dashboard.png)
- [Admin dashboard](documentation/03-Application-Screenshots/06-Admin-Dashboard.png)
- [Favorites](documentation/03-Application-Screenshots/07-Favourites-page.png)
- [Purchased recipe](documentation/03-Application-Screenshots/08-Purchased-recipe.png)
- [Admin transactions](documentation/03-Application-Screenshots/09-Admin-transaction-page.png)

See the [documentation index](documentation/README.md), the [heuristic usability evaluation](documentation/04-Usability-Evaluation/Usability-Evaluation.md), the [participant evaluation template](documentation/04-Usability-Evaluation/Participant-Testing-Template.md), and [release notes](documentation/05-Release-Notes/README.md).

## Repository structure

```text
recipehub-project/
├── README.md
├── docs/                         # Existing project notes
├── documentation/                # Diagrams, screenshots, evaluation, release notes
├── recipehub-client/             # Next.js application and UI tests
└── recipehub-server/             # Express API, MongoDB access, and API tests
```

The client and server have separate package files and lockfiles within this combined Git repository.

## Requirements

Use Node.js 20.9 or later (required by the Next.js 16 client) and npm. Install the frontend and backend dependencies separately with `npm ci` from their respective directories.

## Environment configuration

No example environment files are included. Create local environment files and never commit populated secrets. The names below are read by this repository’s source code.

Create `recipehub-client/.env.local`:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:5000
NEXT_PUBLIC_IMGBB_API_KEY=
```

`NEXT_PUBLIC_BASE_URL` is the Express API origin. `NEXT_PUBLIC_IMGBB_API_KEY` is used by browser-side image upload code and is public to the browser by design; use a key intended for client-side use and configure provider restrictions where available.

Create `recipehub-server/.env`:

```env
PORT=5000
MONGO_DB_URI=
DB_NAME=
JWT_SECRET=
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

`MONGO_DB_URI` and `DB_NAME` select the MongoDB connection and database. `JWT_SECRET` signs application JWTs. `CLIENT_URL` is used for allowed origins, redirects, and Stripe return URLs. Google credentials enable the Better Auth Google provider. Stripe credentials support Checkout and webhook signature verification. Leave credential values private. Test runs generate synthetic secrets and an isolated MongoMemoryServer URI automatically; do not point tests at a production database.

## Run the backend

```powershell
cd recipehub-server
npm ci
npm run dev
```

The development server listens on port 5000 by default. `npm start` runs the production entry point. The Express application is exported from `app.js`; database connection and HTTP startup are in `index.js`.

## Run the frontend

In another terminal:

```powershell
cd recipehub-client
npm ci
npm run dev
```

The Next.js development server defaults to `http://localhost:3000`.

## Automated tests and verification

Run the backend API tests:

```powershell
cd recipehub-server
npm test
```

The backend suite uses Jest, Supertest, and MongoMemoryServer. It sets a generated expected URI before importing the database module and rejects URI mismatches and non-test database names. Synthetic users and test-only JWT secrets are used. The suite does not perform real Stripe transactions or external OAuth flows.

Run the frontend component tests:

```powershell
cd recipehub-client
npm test
```

The frontend suite uses Jest, jsdom, and React Testing Library to exercise the recipe detail and Ratings & Reviews user interactions with mocked API responses.

Latest verification for this repository: **20 backend tests passed; 5 frontend tests passed**. The production frontend build passed. Focused lint on the recipe detail page and its test reported 0 errors and 2 warnings. Full client lint reports 17 errors and 37 warnings across the wider existing project; those unrelated findings were not changed as part of this work. See the [release notes](documentation/05-Release-Notes/README.md) for test scope and limitations.

Other available commands are `npm run build` and `npm run lint` in `recipehub-client`.

## Deployment and repository links

The source documentation/configuration lists these service URLs. Their present availability and deployed commit were not checked during this final repository preparation.

- Frontend: [recipehub-client-delta.vercel.app](https://recipehub-client-delta.vercel.app)
- Backend API: [recipehub-server-dr3a.onrender.com](https://recipehub-server-dr3a.onrender.com)
- GitHub repository: [sadiarahmansmrity0/recipehub-project](https://github.com/sadiarahmansmrity0/recipehub-project)

Package versions currently declare client `0.1.0` and server `1.0.0`. Release notes are prepared for these component versions. No release publication is claimed.

## Future improvements

- Conduct participant usability sessions and document actual observations.
- Validate accessibility and responsive behavior with keyboard, assistive technology, and mobile/tablet testing.
- Resolve existing full-project lint findings and extend test coverage for external-service success flows using safe mocks.
- Confirm deployment availability and deployed revisions during release publication.

## Team

**Team DevDynasty**

- **Sadia Rahman Smrity:** backend development, authentication, database design, payment integration, and deployment.
- **Tabassum Zaman:** frontend development, UI components, responsive design, and dashboard pages.

Developed for the CSE 300 Web Programming course at Metropolitan University, Sylhet.
