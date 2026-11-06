# RecipeHub Server 1.0.0

## Overview

This server release provides RecipeHub’s Express API, MongoDB persistence, authentication/authorization, recipe management, ratings/reviews, premium payment integration, and administration endpoints. It corresponds to the inspected server package version `1.0.0` in the `recipehub-complete` component repository.

## Included functionality

- Node.js and Express application with MongoDB native-driver access.
- Better Auth integration, custom JWT verification, HTTPOnly cookie support, and admin authorization.
- Recipe CRUD, public browsing, likes, favorites, reports, and admin recipe controls.
- Embedded recipe reviews with 1–5 ratings, one review per authenticated user per recipe, edit support, public averages/counts, and reviewer identifier redaction.
- Stripe Checkout session creation, payment verification, and purchased-recipe access.
- Admin statistics, user management, report handling, featured recipes, and transaction listing.
- Exported Express app separated from database connection and server startup.

## Automated checks

- Backend Jest/Supertest suite: **16 passed, 0 failed, 0 skipped** in the latest recorded run.
- JavaScript syntax checks for app, bootstrap, database, and test support files: passed.
- Tests use a dedicated MongoMemoryServer URI checked exactly by the database module, a test-only database name, generated JWT secrets, and synthetic users.
- Invalid checkout input is tested without external Stripe requests. Real Stripe transactions and external OAuth flows were not exercised.

## Documentation

The combined project documentation includes the MongoDB ER diagram, system architecture diagram, application screenshots, setup guidance, and a heuristic usability review. No participant study is claimed.

## Deployment

The existing project documentation lists `https://recipehub-server-dr3a.onrender.com` as the backend URL. Its current availability and the exact deployed commit were not verified for these notes. The repository also contains a Vercel configuration.

## Known limitations

- The suite does not make real payment transactions or validate successful end-to-end Stripe payment completion.
- External Google sign-in and production database behavior are not exercised by the isolated suite.
- No existing tag convention was found in the inspected local history; confirm the tag format before publishing a GitHub release.
