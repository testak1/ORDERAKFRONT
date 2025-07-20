// src/sanityClient.js
import { createClient } from "@sanity/client";

export const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID,
  dataset: process.env.REACT_APP_SANITY_DATASET,
  apiVersion: "2025-07-20",
  useCdn: true,
  token: process.env.REACT_APP_SANITY_TOKEN,
});
