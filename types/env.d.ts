/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL?: string;
    NEXT_PUBLIC_ADMIN_PASSWORD?: string;
    // Add other NEXT_PUBLIC_ variables here as needed
  }
}

