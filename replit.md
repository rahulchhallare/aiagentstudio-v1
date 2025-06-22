# AI Agent Studio

## Overview
Full-stack AI agent application with Express.js backend and React frontend. Features subscription management, AI agent creation and execution, and secure payment processing.

## Project Architecture
- **Backend**: Express.js with TypeScript, Drizzle ORM for database
- **Frontend**: React with Vite, TailwindCSS for styling
- **Database**: PostgreSQL (Supabase/Neon)
- **Payment**: Stripe integration for subscriptions
- **AI**: OpenAI integration for agent responses

## Recent Changes
- 2025-01-22: Migrated from Replit Agent to standard Replit environment
- Fixed port configuration to use environment variable
- Added proper error handling for port conflicts
- Configured for 0.0.0.0 binding for Replit compatibility
- Fixed Razorpay plan ID configuration issues
- Updated payment system with correct plan IDs from dashboard
- Added payment link fallbacks for hosted page issues
- Implemented manual payment flow as backup solution
- Switched to payment links as primary method (resolves hosted page errors)
- Payment system fully functional with ₹999 Pro monthly plan

## User Preferences
- Language: English
- Communication: Professional, concise responses