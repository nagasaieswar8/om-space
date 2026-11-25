# OM SPACE Architecture

## System overview

OM SPACE is a single Next.js application. The browser renders React pages and calls route handlers in the same application. Route handlers use Mongoose to read and write MongoDB documents.

```text
Browser
  -> Next.js App Router pages and React components
  -> Next.js API route handlers
  -> MongoDB through Mongoose
```

Optional integrations:

- Google Maps components use the configured public Maps key.
- The property assistant calls Google Generative AI using a server-side Gemini key.
- Listing images are referenced by URL; the application does not implement image upload storage.

## Main areas

| Area | Source | Responsibility |
| --- | --- | --- |
| Pages and layouts | `app/**` | Home, listings, property details, comparison, sign-in, and role dashboards |
| Shared UI | `components/**` | Navigation, property cards and forms, enquiries, maps, and assistant UI |
| API | `app/api/**` | Authentication, registration, property operations, saved listings, enquiries, and admin operations |
| Access and shared logic | `lib/**` | Database connection, role normalization, ownership checks, and client comparison state |
| Data models | `models/**` | Users, properties, enquiries, and saved properties |

## Roles and request flow

1. A user signs in through NextAuth's credentials provider. Password verification uses bcryptjs.
2. The session carries the user's role and identifier.
3. Protected API handlers retrieve the server session and check the role.
4. Agency listing and enquiry operations additionally check ownership before changing records.
5. The handler reads or writes MongoDB through the relevant Mongoose model and returns JSON to the page.

The UI is not the security boundary: server handlers must enforce permissions independently.

## Data model summary

- **User** stores account identity and role data.
- **Property** stores listing details and the responsible agency/agent reference. Property images are URLs.
- **Inquiry** stores a customer's message, property reference, status, and agency reply thread.
- **SavedProperty** links a customer to a property; a unique user/property pair prevents duplicate saves.

The application supports both MongoDB identifiers and legacy string property identifiers in relevant property lookups.

## API areas

| Route area | Responsibility |
| --- | --- |
| `/api/auth/*` | NextAuth credentials session |
| `/api/register` | Account registration |
| `/api/properties` and `/api/properties/[id]` | Property reads and role-authorized listing changes |
| `/api/saved-properties` | Customer saved listings |
| `/api/inquiries` and `/api/inquiries/[id]` | Customer and agency enquiry workflows |
| `/api/inquiries/[id]/reply` | Agency reply to an accessible enquiry |
| `/api/admin/stats` and `/api/admin/users` | Admin statistics and user management |
| `/api/chat` | Optional Gemini-backed assistant |

## Configuration and runtime dependencies

The application reads configuration from a local `.env` file. `MONGODB_URI` is required for database-backed workflows. `NEXTAUTH_URL` and `NEXTAUTH_SECRET` configure authentication. Maps and Gemini features also need their respective keys. Seed accounts are controlled by the `SEED_*` variables; never place real credentials in source files or documentation.

For exact setup commands, see the root [README.md](../README.md). For constraints and incomplete work, see [limitations.md](./limitations.md).
