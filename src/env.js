import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    UPLOADTHING_TOKEN: z.string().min(1),
    RESEND_TOKEN: z.string().min(1),

    AZURE_OCR_KEY: z.string().min(1),
    AZURE_OCR_ENDPOINT: z.string().url(),
    AZURE_OCR_REGION: z.string().min(1),

    AZURE_AI_KEY: z.string().min(1),
    AZURE_AI_API_KEY: z.string().min(1),
    AZURE_AI_ENDPOINT: z.string().url(),
    AZURE_AI_REGION: z.string().min(1),
    AZURE_AI_DEPLOYMENT: z.string().min(1),
    AZURE_AI_API_VERSION: z.string().min(1),

    POLAR_ACCESS_TOKEN: z.string().min(1),
    POLAR_SUCCESS_URL: z.string().url(),

    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  },
  client: {
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    RESEND_TOKEN: process.env.RESEND_TOKEN,

    AZURE_OCR_KEY: process.env.AZURE_OCR_KEY,
    AZURE_OCR_ENDPOINT: process.env.AZURE_OCR_ENDPOINT,
    AZURE_OCR_REGION: process.env.AZURE_OCR_REGION,

    AZURE_AI_KEY: process.env.AZURE_AI_KEY,
    AZURE_AI_API_KEY: process.env.AZURE_AI_API_KEY,
    AZURE_AI_ENDPOINT: process.env.AZURE_AI_ENDPOINT,
    AZURE_AI_REGION: process.env.AZURE_AI_REGION,
    AZURE_AI_DEPLOYMENT: process.env.AZURE_AI_DEPLOYMENT,
    AZURE_AI_API_VERSION: process.env.AZURE_AI_API_VERSION,

    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_SUCCESS_URL: process.env.POLAR_SUCCESS_URL,

    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
