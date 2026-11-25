# OM SPACE Limitations and Incomplete Work

This list reflects the current repository. It distinguishes missing functionality from features that are implemented but depend on external configuration.

## Not implemented or not evidenced in this repository

| Item | Current state | Reason / impact |
| --- | --- | --- |
| Property image upload | Listing forms accept an image URL; no upload endpoint or object-storage integration is present. | Upload and storage were not implemented, so listing images must be hosted elsewhere. |
| Real-time messaging | Enquiries and agency replies are stored as application records; there is no real-time messaging transport. | The current workflow is an enquiry thread rather than live chat. |
| Interview validation | The interview-notes file is an empty evidence template. | No interview responses were supplied or recorded here, so the problem assumptions and usability outcomes remain unvalidated. |
| Automated test suite | No test runner or test command is defined in `package.json`. | Automated regression coverage is not configured in the current repository; run the production build as a basic integration check. |
| Production hosting setup | The repository contains application code and deployment notes, but no configured production deployment or environment secrets. | Hosting, database access, and secure environment configuration must be set up separately before a live deployment. |

## Implemented features with external requirements

- **Maps and Street View:** depend on Google Maps configuration, an API key, and the relevant service availability.
- **Property assistant:** depends on `GEMINI_API_KEY`; without it, the chat API reports that chat is not configured.
- **Database workflows:** depend on a reachable MongoDB instance and suitable `MONGODB_URI` configuration.
- **Seed accounts:** require local seed password values. Never commit these credentials.

## Data and validation caveats

- Listings and demo records are not a substitute for independently verified property information.
- No interview-derived findings, production performance measurements, or deployment validation are claimed in this repository.
- A successful local build does not verify external API credentials, database connectivity, or production hosting.
