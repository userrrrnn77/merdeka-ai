// src/types/env.d.ts

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PORT: string;
    LOG_LEVEL: string;

    MONGODB_URI: string;

    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    SUPABASE_JWT_SECRET?: string;

    QDRANT_URL: string;
    QDRANT_API_KEY?: string;

    CLOUDFLARE_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
    R2_PUBLIC_URL?: string;

    // COHERE — full stack: chat completion + embedding
    COHERE_API_KEY: string;
    COHERE_BASE_URL: string;
    COHERE_CHAT_MODEL: string;
    COHERE_EMBED_MODEL: string;

    RAG_SIMILARITY_THRESHOLD: string;

    FRONTEND_URL: string;

    RATE_LIMIT_WINDOW_MS: string;
    RATE_LIMIT_MAX_FREE: string;
    RATE_LIMIT_MAX_PREMIUM: string;

    SENTRY_DSN?: string;
  }
}
