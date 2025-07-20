// src/sanityClient.js
import { createClient } from "@sanity/client";

export const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID, // Get these from your Sanity project settings
  dataset: process.env.REACT_APP_SANITY_DATASET,
  apiVersion: "2025-07-20", // use current date (YYYY-MM-DD) to get the newest API version
  useCdn: true, // set to false for quicker updates (useful in dev), true for production for caching
  token: process.env.REACT_APP_SANITY_TOKEN, // Required for authenticated writes/reads for sensitive data
});

// You'll need to create a Sanity API Token with 'editor' permissions for your frontend
// Go to sanity.io/manage -> select your project -> API -> Tokens -> Add new token
