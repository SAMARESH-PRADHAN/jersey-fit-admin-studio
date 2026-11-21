# Jersey Fit — Backend Service

PostgreSQL & S3-compatible backend for the Jersey Fit store and admin studio. Built with Node.js, TypeScript, Drizzle ORM, Zod, and AWS S3 SDK.

## Features
- **Database:** PostgreSQL (Neon Serverless) with Drizzle ORM migrations.
- **Server-Side Pricing Engine:** Computes bulk volume tiers (strictly on product price), print options, add-ons, coupon validation, GST, and 50% advance payments.
- **Fulfillment & Payment Transactions:** Sequence-generated order numbers (`JF-####`), atomic status history transitions, and balance collection tracking.
- **Hierarchical Rule Engine:** Resolves settings `Subcategory` $\to$ `Category` $\to$ `Global` $\to$ `Defaults`.
- **Security & Auth:** Rate-limited authentication, argon2/bcrypt password hashing, signed JWT tokens, role-based protection (`admin`, `staff`), and full mutation audit logging.
- **Object Storage:** S3-compatible integration for product images and secure presigned URLs for customer logos and team rosters.
- **Full Backup & Restore:** Complete export/import supporting all entities including reviews and custom design options.

---

## Getting Started

### 1. Prerequisites
- Node.js 22 LTS or higher
- npm 11+
- A Neon PostgreSQL database instance
- S3-compatible bucket (Neon partner bucket, AWS S3, Cloudflare R2, or MinIO)

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your database URL and S3 credentials:
```env
DATABASE_URL="postgres://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/jersey_fit?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long"
INITIAL_ADMIN_EMAIL="admin@jerseyfit.in"
INITIAL_ADMIN_PASSWORD="ChangeMeInProduction123!"
```

### 3. Install Dependencies
```bash
cd backend
npm install
```

### 4. Database Migrations & Seeding
Push the database schema to your Postgres instance:
```bash
npm run db:push
```
Or generate and run migrations:
```bash
npm run db:generate
npm run db:migrate
```

Seed the database with default categories, sample products, discount rules, demo orders, and the initial admin user:
```bash
npm run db:seed
```

### 5. Running Tests
Run the Vitest test suite:
```bash
npm run test
```

### 6. Typecheck
```bash
npm run typecheck
```

---

## API Documentation
See [docs/API.md](docs/API.md) for full endpoint specifications, input Zod schemas, and response types.
