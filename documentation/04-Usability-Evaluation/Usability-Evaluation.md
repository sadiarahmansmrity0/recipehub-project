# RecipeHub Usability Evaluation

## Evaluation objective

Review the clarity and usability of the main RecipeHub journeys and identify practical improvements for the academic submission and future development.

## Method and integrity statement

This is a **heuristic and code-based review** of the inspected Next.js client, Express routes, and existing desktop screenshots in `03-Application-Screenshots`. It uses task completion, ease of learning, navigation clarity, consistency, feedback, readability, validation, responsive behavior, visibility of important actions, and basic accessibility as review criteria.

No live browser walkthrough or deployment check was performed for this report. No participants were recruited, no survey was administered, and no satisfaction scores or task success rates were collected. The observations below are limited to source and screenshot evidence; recommendations that need interaction or viewport testing are identified as such.

## Scope

The review covers nine journeys: homepage, recipe browsing, recipe detail, registration/login, recipe creation, liking and favoriting, review submission/editing, premium access, and administrator dashboard access. Evidence includes the existing screenshots and inspected client/server implementation. It does not cover every browser, device, network condition, assistive technology, or external service state.

## Scenarios and observations

| Scenario | Evidence-based observation | Usability assessment |
|---|---|---|
| Visit the homepage | The desktop home screenshot has a persistent top navigation, clear “Explore Recipes” and “Share Recipe” actions, and a strong page heading. | Primary next steps are visible. The displayed “500+”, “100+”, and “15K+” figures are hard-coded in the page, and their relationship to live platform data is not explained. |
| Browse recipes | The application has a dedicated Browse Recipes navigation item, and the screenshot shows recipe browsing as a distinct page. The client exposes search/filter and pagination behavior. | The information architecture is easy to recognize. Search/filter feedback and empty/error states should be confirmed through hands-on testing; the existing capture does not show those states. |
| Open recipe details | The detail page presents recipe actions and a premium purchase panel when content is locked. Reviews appear below the recipe content or paywall; the existing detail screenshot shows the review section below the purchase area. | Purchase cost and the unlock action are visible. Review discovery requires scrolling on the captured page, so moving the summary higher or adding a jump link may improve discoverability. |
| Register or log in | Dedicated registration and login pages are present. Email/password flows use custom server routes; Google sign-in uses the Better Auth integration and callback synchronization. | Separate entry pages are familiar. This review did not submit credentials or exercise third-party Google authentication. Clear inline error and password-recovery behavior should be included in participant testing. |
| Create a recipe | A protected “Add Recipe” dashboard page supports recipe fields and image upload. The backend validates required fields and a minimum 50-word instruction length; the form includes image upload feedback and recipe limits. | Constraints protect data quality, but the 50-word minimum and standard-user recipe limit should be explained before submission to avoid late form errors. Upload and validation behavior was not exercised interactively for this evaluation. |
| Like and save a favorite | Recipe actions include Like and Add to Favorites. Favorites are available from the user dashboard and have an empty-state message. | Actions are named plainly. The code provides feedback for several actions, but feedback consistency and keyboard activation need hands-on validation. |
| Submit or edit a review | The detail page has a labeled ratings section, a 1–5-star radio group with accessible labels, a comment field, a sign-in prompt, and a submit/update state. The API enforces one review per user/recipe and strips reviewer identifiers from public responses. | Rating and review actions are grouped clearly, and the sign-in path is explicit. Confirm focus handling, validation announcements, and edit discoverability with keyboard and screen-reader testing. |
| Access premium functionality | A locked-recipe screenshot shows the one-time price and “Unlock Recipe via Stripe” action. The backend creates Stripe Checkout sessions and verifies paid access. | Price and consequence are visible before purchase. Real checkout and payment recovery were not tested in this review; test environments must avoid real transactions. |
| Access the admin dashboard | The admin screenshot shows a persistent sidebar with separate user and admin sections and a highlighted current page. Admin APIs use server-side admin authorization. | The sidebar groups tools by role and the selected page is visually highlighted. Review mobile navigation and confirm users without administrator access receive understandable feedback. |

## Findings and priorities

| Priority | Finding | Recommendation |
|---|---|---|
| Medium | Homepage community totals are hard-coded in the client and may be read as current platform statistics. | Either derive the figures from verified data or label them as illustrative/static values. |
| Medium | The review section appears below the premium purchase panel in the existing recipe detail screenshot, which can reduce review visibility. | Consider a review summary near the recipe title or a “Read reviews” anchor while retaining the complete review section. |
| Medium | Form and authentication error behavior, responsive breakpoints, and keyboard/screen-reader behavior were not fully exercised. | Run the participant protocol below on desktop and mobile widths, including keyboard-only and assistive technology checks. |
| Low | Favorite removal uses browser confirmation/alert patterns in parts of the UI. | Prefer a consistent in-page confirmation or status message, with an undo option where practical. |
| Low | The screenshots are desktop captures and do not establish responsive usability. | Capture phone and tablet layouts and inspect for overflow, compressed controls, and inaccessible navigation. |

Priorities reflect likely user impact and the limited evidence in this heuristic review; they are not ratings derived from participants.

## Recommendations

1. Run the participant protocol with representative visitors, members, premium users, and administrators where available; record task completion and observed friction without collecting unnecessary personal data.
2. Test navigation and forms at narrow widths and with keyboard-only interaction; verify labels, focus order, visible focus, and announcement of validation/status messages.
3. Explain recipe submission limits and recipe-content requirements before users complete the form.
4. Validate homepage statistics against a data source or mark them as illustrative.
5. Improve access to reviews and use consistent in-page feedback for favorites and other state-changing actions.
6. Test Stripe only with Stripe test credentials and test-mode accounts; do not make live charges during usability testing.

## Limitations

- This was a source-and-screenshot heuristic review, not a live usability session.
- No participants, interviews, survey responses, completion times, or satisfaction scores are represented.
- Existing screenshots show desktop states and may not match the current live deployment.
- External dependencies, including Google sign-in, ImgBB, MongoDB hosting, and Stripe, were not exercised as part of this review.
- Recommendations about actual task difficulty and responsive behavior require direct user and device testing.

## Conclusion

The inspected interface has recognizable navigation, role-specific dashboard areas, explicit recipe actions, visible premium pricing, and a dedicated review interface. The most actionable improvements are clarifying static homepage metrics, improving review discoverability, and validating form feedback, responsive layouts, and accessibility with real users. Those points remain recommendations until tested.

## Related material

- [Participant testing template](Participant-Testing-Template.md)
- [Application screenshots](../03-Application-Screenshots/)
- [System architecture](../02-System-Architecture/RecipeHub_Architecture.png)
- [MongoDB ER diagram](../01-ER-Diagram/RecipeHub_MongoDB_ERD.png)
