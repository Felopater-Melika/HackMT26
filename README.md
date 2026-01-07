# Cliniq Care

A healthcare application that helps users analyze medications, track medical conditions, and receive personalized medication advice using AI-powered analysis.

## Overview

Cliniq Care enables users to scan medication labels, analyze drug interactions, and receive tailored recommendations based on their medical profile. The platform uses Azure OpenAI and LangChain to provide intelligent medication analysis.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- **Authentication**: [Better Auth](https://www.better-auth.com)
- **API**: [tRPC](https://trpc.io)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [Shadcn UI](https://ui.shadcn.com)
- **AI/ML**: Azure OpenAI + [LangChain](https://js.langchain.com)
- **Analytics**: PostHog
- **Deployment**: Vercel

## Features

### ✅ Implemented

- **Authentication**
  - Email/password signup and login
  - Google OAuth integration
  - Email verification
  - Password reset

- **Medication Analysis**
  - OCR-based medication label scanning
  - Manual medication entry
  - AI-powered medication analysis using Azure OpenAI
  - Drug interaction detection
  - Personalized recommendations based on user profile

- **User Profile**
  - Profile management (name, age, gender)
  - Medical conditions tracking
  - Condition selector with search

- **Dashboard**
  - View past medication analysis reports
  - Detailed medication insights
  - Delete reports

- **SEO**
  - Metadata optimization
  - Sitemap generation
  - Robots.txt configuration
  - Structured data (JSON-LD)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Azure OpenAI account
- Resend account (for emails)
- Google OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cliniq
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Required environment variables:
```env
# Database
DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Azure OpenAI
AZURE_AI_ENDPOINT="https://your-resource.openai.azure.com"
AZURE_AI_API_KEY="your-api-key"
AZURE_AI_DEPLOYMENT="your-deployment-name"
AZURE_AI_API_VERSION="2024-02-15-preview"

# Resend (Email)
RESEND_API_KEY="your-resend-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# PostHog (Optional)
NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

4. Run database migrations:
```bash
bun run db:push
```

5. Seed the database (optional):
```bash
bun run db:seed
```

6. Start the development server:
```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
cliniq/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes (auth, tRPC)
│   │   └── app/          # Authenticated app pages
│   ├── components/       # React components
│   │   ├── authentication/
│   │   ├── profile/
│   │   └── ui/           # Shadcn UI components
│   ├── lib/              # Core libraries (auth, AI analyzer)
│   ├── server/           # Server-side code
│   │   ├── api/          # tRPC routers
│   │   └── db/           # Database schema and config
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript type definitions
├── drizzle/              # Database migrations
└── public/               # Static assets
```

## Roadmap / Tasks

### 🔨 In Progress

- None currently

### 📋 Planned

- **Landing Page**
  - Create a proper marketing landing page
  - Hero section with value proposition
  - Features showcase
  - Testimonials/social proof
  - Call-to-action sections

- **Payment Integration**
  - Integrate payment processing (Stripe/Polar)
  - Subscription management
  - Usage-based billing
  - Payment history and invoices

- **Images Queue**
  - Implement background job queue for image processing
  - Queue OCR processing tasks
  - Retry logic for failed OCR jobs
  - Progress tracking for queued tasks

- **Media Upload (UploadThing)**
  - Integrate UploadThing for medication label images
  - Image upload and storage
  - Image optimization and resizing
  - Secure file access controls

- **PDF Generation**
  - Generate PDF reports for medication analyses
  - Downloadable medication summaries
  - Shareable report links
  - Email PDF reports to users

### 💡 Future Considerations

- Mobile app (React Native)
- Medication reminders and notifications
- Integration with pharmacy APIs
- Telemedicine features
- Multi-language support

## API Documentation

### tRPC Routers

- `medications.*` - Medication scanning and analysis
- `profile.*` - User profile management
- `conditions.*` - Medical conditions management
- `reports.*` - Analysis report management
- `ocr.*` - OCR processing

### Authentication Endpoints

- `/api/auth/signin` - Sign in
- `/api/auth/signup` - Sign up
- `/api/auth/callback/google` - Google OAuth callback
- `/api/auth/verify-email` - Email verification
- `/api/auth/reset-password` - Password reset

## Database Schema

Key tables:
- `users` - User accounts (via Better Auth)
- `profiles` - User profile information
- `conditions` - Medical conditions
- `user_conditions` - User-condition relationships
- `scans` - Medication scan sessions
- `medications` - Medication records
- `scan_medications` - Scan-medication relationships
- `reports` - Analysis reports

See `src/server/db/schema.ts` for full schema definitions.

## Development

### Running Locally

```bash
# Development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

### Database Commands

```bash
# Generate migration
bun run db:generate

# Push schema changes
bun run db:push

# Run migrations
bun run db:migrate

# Seed database
bun run db:seed
```

### Code Quality

- TypeScript for type safety
- Biome for linting and formatting
- ESLint for additional checks

## Deployment

The application is deployed on Vercel. Environment variables should be configured in the Vercel dashboard.

### Build Configuration

- Build Command: `bun run build`
- Output Directory: `.next`
- Install Command: `bun install`

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure build passes: `bun run build`
4. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub or contact support@cliniq.care.
