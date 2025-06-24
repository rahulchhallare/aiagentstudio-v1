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
- Fixed React hooks error in billing page after payment completion
- Payment verification and subscription activation working properly
- Completely rebuilt billing component with proper React patterns
- Fixed webhook signature verification for payment processing
- Fixed subscription activation after payment - now properly updates user's plan status
- Manual subscription activation endpoint working as backup to webhook failures
- Payment history now properly displays transaction records with correct currency formatting
- Created manual payment history creation endpoint for administrative use
- Implemented downgrade to free plan functionality with dedicated endpoint
- Downgrade bypasses Razorpay API issues and immediately cancels subscription in database
- Fixed upgrade functionality for users on Free plan to create new payment links
- Manual payment endpoint now handles both new subscriptions and upgrades properly
- Fixed payment history display to show USD amounts instead of INR for better user experience
- Implemented micro-interactions for price display transitions with smooth animations
- Added hover effects, scale transitions, and animated elements for better UX
- Fixed payment history amount calculation for subscription upgrades to show correct USD values
- Fixed "Customer already exists" error for users re-upgrading after downgrade by implementing proper customer lookup
- Fixed webhook processing error that was causing JSON parsing failures in Razorpay webhook handler
- Fixed subscription activation to properly update plan details when users re-upgrade after downgrade
- Fixed subscription plan discrepancy by properly updating database records and creating missing payment history

## User Preferences
- Language: English
- Communication: Professional, concise responses