// src/sanityClient.js
import { createClient } from "@sanity/client";

export const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID,
  dataset: process.env.REACT_APP_SANITY_DATASET,
  apiVersion: new Date().toISOString().split("T")[0],
  useCdn: false,
  token: process.env.REACT_APP_SANITY_TOKEN,
});
