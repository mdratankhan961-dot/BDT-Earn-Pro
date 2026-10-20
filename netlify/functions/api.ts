import serverless from 'serverless-http';
import { app } from '../../server';

/**
 * Netlify Serverless Function Handler for BDT Earn Pro API.
 * This runs all Express endpoints (/api/*) serverlessly on Netlify without needing an external server.
 */
export const handler = serverless(app);
