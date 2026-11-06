# RecipeHub project documentation

This directory contains the ER diagram, system architecture diagram, application screenshots, usability evaluation, participant evaluation template, and release notes for this repository. The setup guide and complete feature overview are in the [project README](../README.md).

## Database design

The [MongoDB ER diagram](01-ER-Diagram/RecipeHub_MongoDB_ERD.png) summarizes the primary `users`, `recipes`, `favorites`, `payments`, `reports`, and `sessions` collections. Reviews are embedded in recipe documents rather than stored in a separate collection. The [SVG diagram](01-ER-Diagram/RecipeHub_MongoDB_ERD.svg) is available for zooming.

## System architecture

The [system architecture diagram](02-System-Architecture/RecipeHub_Architecture.png) shows the Next.js and React frontend, Express API, MongoDB, authentication responsibilities, and Stripe/ImgBB integrations. An [SVG version](02-System-Architecture/RecipeHub_Architecture.svg) is also available.

## Application screenshots

The following existing captures illustrate the main interfaces:

- [Home](03-Application-Screenshots/01-Home.png)
- [Recipe browsing](03-Application-Screenshots/02-Recipe-Browsing.png)
- [Recipe details and reviews, first capture](03-Application-Screenshots/03.0-Recipe-Details-Reviews.png)
- [Recipe details and reviews, second capture](03-Application-Screenshots/03.1-Recipe-Details-Reviews.png)
- [Login](03-Application-Screenshots/04.0-Login.png) and [registration](03-Application-Screenshots/04.1-Register.png)
- [Add recipe dashboard](03-Application-Screenshots/05-Add-Recipe-User-Dashboard.png)
- [Admin dashboard](03-Application-Screenshots/06-Admin-Dashboard.png)
- [Favorites](03-Application-Screenshots/07-Favourites-page.png)
- [Purchased recipe](03-Application-Screenshots/08-Purchased-recipe.png)
- [Admin transactions](03-Application-Screenshots/09-Admin-transaction-page.png)

These are documentation screenshots, not proof of current deployment availability.

## Usability evaluation

The [heuristic and code-based usability evaluation](04-Usability-Evaluation/Usability-Evaluation.md) records source and screenshot observations, recommendations, and limitations. It is not a participant study. A [participant evaluation template](04-Usability-Evaluation/Participant-Testing-Template.md) is provided for future validation.

## Release notes

The [release notes index](05-Release-Notes/README.md) and client/server version notes describe the declared package versions for this combined repository. They are prepared documentation; no GitHub release was published as part of this work.
