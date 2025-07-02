# AI Agent Studio

## Overview
Full-stack AI agent application with Express.js backend and React frontend. Features subscription management, AI agent creation and execution, secure payment processing, and a comprehensive customer service chatbot system.

## Project Architecture
- **Backend**: Express.js with TypeScript, Drizzle ORM for database
- **Frontend**: React with Vite, TailwindCSS for styling
- **Database**: PostgreSQL with Drizzle ORM
- **Payment**: Stripe integration for subscriptions  
- **AI**: OpenAI integration for agent responses and chatbot
- **Chatbot**: Full customer service system with GDPR compliance, order tracking, returns workflow

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
- Fixed upgrade flow to use proper Razorpay payment links instead of automatic prorated charges that showed incorrect amounts
- Fixed subscription activation to properly map plan IDs and activate correct plans after payment completion
- Fixed upgrade flow after downgrades - payments now automatically activate correct subscription plans via webhook
- Enhanced webhook handler to detect plan type by payment amount and auto-activate subscriptions
- 2025-01-01: Added comprehensive customer service chatbot system
- Built complete chatbot with FAQ handling, order tracking, returns workflow, and human escalation
- Implemented GDPR consent management and data privacy compliance  
- Created embeddable widget for easy website integration
- Added analytics dashboard for monitoring chatbot performance and user interactions
- Integrated with PostgreSQL database for chat session and message storage
- Added chatbot to homepage and main navigation for easy access
- Featured customer service chatbot prominently in the platform showcase
- 2025-01-02: CRITICAL CHATBOT FIXES - Fixed conversation flow and context management
- Resolved context loss issue where chatbot gave generic responses regardless of user input
- Fixed return request flow to properly handle "yes" confirmations and collect order numbers  
- Enhanced session state management to maintain conversation context between messages
- Added proper handling for numbered menu selections (1, 2, 3) from service options
- Improved order tracking with comprehensive mock data for demo purposes
- Chatbot now ready for Shopify/e-commerce integration with proper customer support workflows

## User Preferences
- Language: English
- Communication: Professional, concise responses