# RecipeHub Client 0.1.0

## Overview

This release note describes the Next.js and React frontend package declared as version `0.1.0` in this combined repository.

## Included functionality

- Home page, recipe discovery, search/filter/pagination, and recipe details.
- Registration, login, Google sign-in integration, profile and dashboard pages.
- Recipe creation and management, likes, favorites, and reports.
- Ratings and reviews with 1–5 star selection, written comments, one review per authenticated user and recipe, and editing of the user’s own review.
- Premium recipe and membership purchase entry points, backed by the Express Stripe integration.
- User and administrator dashboards for recipes, favorites, purchases, users, reports, featured recipes, and transactions.
- Responsive layouts, light/dark theme, and ImgBB image-upload integration.

## Automated checks

- Frontend Jest/React Testing Library suite: **5 passed, 0 failed, 0 skipped** in the final synchronization run.
- Production `next build`: passed.
- Focused lint on the recipe details page and its test: 0 errors, 2 warnings. Full client lint reports 17 errors and 37 warnings elsewhere in the project.
- Tests render the actual recipe details page and exercise public review display, signed-out sign-in navigation, star selection, submission feedback, pending state, and server validation feedback using mocked API responses.
- No real Stripe payment, live authentication, browser matrix, or participant usability study was performed.

## Documentation and deployment

The combined repository includes ER and architecture diagrams, application screenshots, and a heuristic usability evaluation. Existing project documentation lists `https://recipehub-client-delta.vercel.app` as the frontend URL; current availability and deployed revision were not checked.

## Known limitations

- Full-project lint reports existing errors and warnings; this was not resolved as part of documentation and test synchronization.
- Responsive behavior and accessibility have not been validated across real devices or assistive technologies.
- The usability report is a source/screenshot-based heuristic review, not a participant study.
