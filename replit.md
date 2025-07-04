# Team Rewards Management System

## Overview

This is a full-stack web application for Dhadda & Co. Chartered Accountants designed to manage team rewards and track professional contributions. The system allows team members to submit activities for approval and earn points with monetary values. Approvers can review and approve/reject submissions, while all users can view leaderboards and track their progress.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for development and production builds
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with JSON responses
- **Error Handling**: Centralized error middleware with proper HTTP status codes

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication System
- **Provider**: Replit Auth integration
- **Session Storage**: PostgreSQL-backed sessions table
- **User Management**: Automatic user creation/updates on login
- **Role-Based Access**: Contributors and approvers with different permissions
- **Security**: Secure HTTP-only cookies with proper CSRF protection

### Activity Management
- **Categories**: Predefined activity types with points and monetary values
- **Submission Flow**: Users submit activities with descriptions and optional attachments
- **Approval Process**: Approvers can approve/reject with optional feedback
- **Status Tracking**: Pending, approved, and rejected states with timestamps

### Rewards System
- **Points Calculation**: Based on activity categories and approval status
- **Monetary Values**: Indian Rupees associated with each activity type
- **Leaderboard**: Real-time ranking based on total points and earnings
- **Statistics**: Individual user stats including total contributions

### User Interface
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Dashboard**: Overview of stats, recent activities, and leaderboard
- **Navigation**: Fixed sidebar with role-based menu items
- **Forms**: Validated forms with proper error handling and feedback
- **Notifications**: Toast notifications for user actions and errors

## Data Flow

### User Authentication Flow
1. User clicks login → Redirected to Replit Auth
2. Successful auth → User data stored/updated in database
3. Session created with PostgreSQL storage
4. User redirected to dashboard with authenticated state

### Activity Submission Flow
1. User fills activity form with category, description, date
2. Form validation using Zod schemas
3. Data submitted to backend API
4. Activity stored with "pending" status
5. Approvers notified of pending submissions

### Approval Process Flow
1. Approvers view pending activities dashboard
2. Review activity details and attachments
3. Approve with automatic point allocation or reject with reason
4. User notifications and leaderboard updates
5. Activity status changes to approved/rejected

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **express**: Web server framework
- **passport**: Authentication middleware

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tailwindcss**: Utility-first CSS framework
- **tsx**: TypeScript execution for development

### Replit-Specific Dependencies
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit integration features

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev`
- **Port**: 5000 (configurable)
- **Hot Reload**: Vite HMR for frontend, tsx watch for backend
- **Database**: Connects to provisioned PostgreSQL instance

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: esbuild bundle to `dist/index.js`
- **Assets**: Static file serving from build directory
- **Environment**: NODE_ENV=production with optimizations

### Replit Deployment
- **Platform**: Replit Autoscale deployment target
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Port Mapping**: Internal 5000 → External 80
- **Database**: Automatic PostgreSQL provisioning

## Changelog

```
Changelog:
- June 20, 2025. Initial setup
- June 20, 2025. Added comprehensive role-based access control
- June 20, 2025. Integrated official Dhadda & Co. logo throughout application
- June 20, 2025. Restricted Team Directory access to approvers only
- June 20, 2025. Enhanced dashboard with clickable user names and improved pending approvals display
- June 20, 2025. Implemented navy blue color theme matching company logo with proper text contrast
- June 20, 2025. Added collapsible sidebar with mobile hamburger menu and resolved all text contrast issues
- June 20, 2025. Created clickable stats cards linking to detailed activity lists with filtering and concise card layout
- June 20, 2025. Fixed header positioning to prevent sidebar from hiding dashboard title text
- June 20, 2025. Enhanced activity cards to display full descriptions and activity dates when viewing user activities
- June 20, 2025. Implemented concise activity list format for user activities page matching My Activities layout
- June 20, 2025. Removed redundant user names from My Activities and Profile pages while keeping them for other users' activities
- June 20, 2025. Added comprehensive search functionality to My Activities with keyword, year, and category filters
- June 20, 2025. Enhanced Points Table with top 3 ranks prominently displayed and collapsible "Others" section
- June 20, 2025. Replaced "Recent Team Activities" with "Recent Contributions" showing only 3 items with "View All" link
- June 20, 2025. Added search functionality to Profile page activity history with keyword, year, and month filters
- June 20, 2025. Created separate "All Activities" navigation tab showing comprehensive team activity overview in concise visual format
- June 20, 2025. Restored My Profile page to original complete format with activity history, search functionality, and performance summary
- June 20, 2025. Updated system to show monetary values to all contributors for their own activities on profile page only, removing approver-only restriction while keeping dashboard focused on points
- June 20, 2025. Implemented comprehensive encashment system allowing users to convert points to cash at ₹100 per point with request submission, approval workflow, and complete transaction history tracking
- June 20, 2025. Enhanced encashment page to display detailed points breakdown showing total earned, redeemed, and balance points with corresponding monetary values for complete transparency
- June 20, 2025. Added comprehensive search and export functionality to All Activities page with real-time filtering and CSV download capabilities
- June 20, 2025. Removed activity history section from My Profile page to simplify interface and focus on performance summary metrics
- June 20, 2025. Removed activity overview section from My Profile page, keeping only essential user information and performance metrics
- June 20, 2025. Enhanced All Activities page to display activity descriptions alongside titles for better context and information
- June 20, 2025. Updated All Activities page to show title and description on same line with vertical bar separator for compact layout
- June 20, 2025. Applied same title and description layout format to My Activities page for consistent user experience
- June 20, 2025. Made activity displays more concise by showing title, description, and status badge all on same row with single line layout
- June 20, 2025. Added comprehensive file path functionality as alternative to URL for sharing local drive content locations with form validation, database storage, and activity display integration
- June 20, 2025. Updated application branding from "Team Rewards Dashboard" to "DCo Rewards Dashboard" across all tabs and pages
- June 20, 2025. Removed "My Activities" and "Encashment" tabs from approver navigation menu for cleaner administrative interface
- June 20, 2025. Implemented concise approval cards with single-line format showing user, activity, and quick approve/reject actions for efficient review workflow
- June 20, 2025. Fixed approval card text display issues by restructuring layout into clear lines, removing monetary values, and eliminating text truncation
- June 20, 2025. Added comprehensive Encashments page for approvers to review and process point-to-cash conversion requests with approval/rejection workflow
- June 20, 2025. Completed branding update by replacing remaining "Team Rewards Dashboard" references with "DCo Rewards Dashboard" and removed subtitle
- June 20, 2025. Implemented role-based dashboard statistics - approvers view team-focused metrics instead of personal stats with updated labels: "Total Points Awarded" and clearer monthly point descriptions
- June 20, 2025. Enhanced dashboard to display both activity counts and reward points with cleaner numerical format, removing redundant "activities" text for streamlined presentation
- June 20, 2025. Updated dashboard title from "Total Points Awarded" to "Total Contributions" for better team-focused messaging
- June 20, 2025. Enhanced all activity displays with prominent attachment links - added "View" buttons for URLs and "Copy Path" buttons for file paths across activity cards and approval cards
- June 20, 2025. Added comprehensive admin panel with sample data cleanup functionality to remove automatically generated users like Amit Kumar and Vikram Gupta, including their activities and data
- June 20, 2025. Enhanced My Profile page with editable designation dropdown featuring 15+ CA firm roles (Junior Associate to Partner) and added Profile Type display showing Contributor/Approver status with role-based descriptions
- June 20, 2025. Updated designation dropdown to 6 specific CA firm roles with automatic role assignment: Partner → Approver, Senior Manager/Manager/Associate/Senior Consultant/Analyst → Contributor, and fixed API request parameter order bug
- June 20, 2025. Added comprehensive profile picture upload functionality to My Profile section with image preview, 5MB file size limit, automatic file cleanup, and secure file storage in uploads/profiles directory
- June 20, 2025. Performed comprehensive database cleanup removing all user accounts except primary user (sethishuchi27@gmail.com), including deletion of 16 activities and 5 user accounts to maintain single-user system
- June 20, 2025. Added delete functionality to My Activities tab allowing users to remove pending activities only, with confirmation dialog and complete backend validation to ensure only pending activities can be deleted
- June 20, 2025. Fixed profile update system to create approval requests instead of direct changes - implemented profile_change_requests table with proper approval workflow requiring Senior Manager or Partner authorization before applying changes
- June 20, 2025. Implemented comprehensive profile change approval system appearing in pending approvals for both Senior Manager/Partner approvers and users who submitted requests, with complete backend API endpoints and frontend display integration
- June 20, 2025. Added first-time login onboarding flow prompting new users to enter name and designation when logging in without profile information, with direct profile setup bypassing approval workflow for initial registration
- June 20, 2025. Removed approval system for profile changes - users can now update their name, designation, and profile picture directly without requiring Senior Manager or Partner approval
- June 20, 2025. Cleaned up database by removing somya.dco@gmail.com user account (ID: 44070421) from system
- June 20, 2025. Enhanced Dashboard with personalized welcome section displaying user's name, designation, and profile picture, and updated Profile edit dialog button text from "Submit for Approval" to "Save" to reflect direct update functionality
- June 20, 2025. Fixed profile picture synchronization between My Profile and Dashboard by implementing forced cache invalidation and refetch to ensure immediate UI updates across all components
- June 20, 2025. Enhanced Points Table in Dashboard to display actual profile pictures instead of initials, with comprehensive cache invalidation for all leaderboard queries to ensure real-time profile picture updates across the application
- June 20, 2025. Fixed activity submission form error by correcting parameter order in apiRequest function call - activities can now be submitted properly without fetch method errors
- June 20, 2025. Fixed Partner role assignment issue - updated user role from contributor to approver to enable access to pending approvals and administrative functions
- June 20, 2025. Enhanced role assignment logic to automatically set both Partner and Senior Manager designations as approver role, ensuring proper access to administrative functions when users update their designation
- June 20, 2025. Fixed approval functionality by correcting API request parameter order in approvals page - approve/reject buttons now work properly without fetch method errors
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```