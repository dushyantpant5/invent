import type { ZodTypeAny } from 'zod';

import {
  signInSchema,
  signUpSchema,
  otpVerificationSchema,
  refreshTokenSchema,
  createInventorySchema,
  joinInventorySchema,
} from '../validators';

export interface RouteResponse {
  description: string;
  schema?: Record<string, unknown>;
}

export interface RouteDefinition {
  path: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  summary: string;
  description?: string;
  tags: string[];
  requestBody?: ZodTypeAny;
  responses: Record<number, RouteResponse>;
}

export const openApiInfo = {
  title: 'API Documentation',
  description: 'Next.js API routes documentation',
  version: '1.0.0',
};

export const servers = [{ url: 'http://localhost:3000' }];

export const tags = [
  { name: 'Auth', description: 'Authentication and session management' },
  { name: 'Inventory', description: 'Inventory management' },
];

export const routes: RouteDefinition[] = [
  {
    path: '/api/auth/signIn',
    method: 'post',
    summary: 'Sign in user',
    description:
      'Authenticates a user with email and password. Access and refresh tokens are set as HTTP-only cookies.',
    tags: ['Auth'],
    requestBody: signInSchema,
    responses: {
      200: { description: 'Login successful. Tokens set as cookies.' },
      400: { description: 'Validation error' },
      401: { description: 'Invalid credentials' },
      500: { description: 'Internal server error' },
    },
  },
  {
    path: '/api/auth/signUp/request-signup',
    method: 'post',
    summary: 'Request sign up',
    description:
      'Initiates registration. Sends an OTP to the provided email and stores signup data in a cookie.',
    tags: ['Auth'],
    requestBody: signUpSchema,
    responses: {
      201: { description: 'OTP sent. Signup data stored in cookie.' },
      400: { description: 'Validation error or user already exists' },
      500: { description: 'Internal server error' },
    },
  },
  {
    path: '/api/auth/signUp/verify-otp',
    method: 'post',
    summary: 'Verify OTP and complete sign up',
    description:
      'Validates the OTP and completes account creation. Access and refresh tokens are set as cookies.',
    tags: ['Auth'],
    requestBody: otpVerificationSchema,
    responses: {
      201: { description: 'Account created. Tokens set as cookies.' },
      400: { description: 'Invalid or expired OTP' },
      500: { description: 'Internal server error' },
    },
  },
  {
    path: '/api/auth/refreshToken',
    method: 'post',
    summary: 'Refresh access token',
    description: 'Issues a new access/refresh token pair using a valid refresh token.',
    tags: ['Auth'],
    requestBody: refreshTokenSchema,
    responses: {
      200: { description: 'New access and refresh tokens returned.' },
      400: { description: 'Validation error' },
      401: { description: 'Session expired. Please sign in again.' },
      500: { description: 'Internal server error' },
    },
  },
  {
    path: '/api/auth/getCoreToken',
    method: 'get',
    summary: 'Get core service JWT',
    description:
      'Returns a signed JWT for the downstream core service, including userId, inventoryId, and role.',
    tags: ['Auth'],
    responses: {
      200: { description: 'Core JWT token payload returned.' },
      401: { description: 'Not authenticated or no active session.' },
      500: { description: 'Internal server error' },
    },
  },
  {
    path: '/api/inventory/create-inventory',
    method: 'post',
    summary: 'Create a new inventory',
    description: 'Creates a new inventory and stores the inventoryId in a cookie.',
    tags: ['Inventory'],
    requestBody: createInventorySchema,
    responses: {
      201: { description: 'Inventory created successfully.' },
      400: { description: 'Validation error' },
      500: { description: 'Failed to create inventory' },
    },
  },
  {
    path: '/api/inventory/join-inventory',
    method: 'post',
    summary: 'Join an inventory by code',
    description:
      'Joins an existing inventory using its unique code and stores the inventoryId in a cookie.',
    tags: ['Inventory'],
    requestBody: joinInventorySchema,
    responses: {
      200: { description: 'Joined inventory successfully.' },
      400: { description: 'Validation error' },
      404: { description: 'No inventory found with this code.' },
      500: { description: 'Internal server error' },
    },
  },
];
