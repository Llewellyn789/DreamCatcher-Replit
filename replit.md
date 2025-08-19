# Overview

DreamCatcher is a full-stack web application that provides AI-powered dream interpretation using Jungian psychology principles. Users can record their dreams through voice input, receive detailed psychological analysis based on Carl Jung's analytical psychology framework, and track their dream patterns over time. The application features a Progressive Web App (PWA) design for mobile-first usage with offline capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React and TypeScript using Vite as the build tool. The UI leverages shadcn/ui components with Radix UI primitives for consistent design patterns. The application uses Tailwind CSS for styling with a custom color scheme featuring gold accents and a dark cosmic theme. State management is handled through React Query (TanStack Query) for server state and React hooks for local state.

## Backend Architecture
The server is implemented using Express.js with TypeScript in ESM format. The API follows RESTful conventions with endpoints for dream CRUD operations, AI analysis, and audio processing. The application uses multer for handling audio file uploads and OpenAI's GPT-4o model for dream analysis. Session management and file handling are implemented for voice recording functionality.

## Database Design
The application uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema includes users and dreams tables, with dreams containing structured fields for content, analysis (stored as JSON), duration, and timestamps. Drizzle Kit handles migrations and schema management.

## Audio Processing
Voice recording is implemented using the Web Audio API with MediaRecorder. Audio files are processed server-side and can be transcribed using OpenAI's Whisper API. The system supports various audio formats including WebM and handles real-time audio streaming.

## AI Integration
Dream analysis is powered by OpenAI's GPT-4o model with structured prompts based on Jungian psychology principles. The analysis returns structured JSON containing archetypes, symbols, unconscious elements, insights, and integration suggestions. The system includes error handling and retry logic for AI service interactions.

## Progressive Web App Features
The application is designed as a PWA with manifest configuration, service worker implementation, and offline capabilities. It includes mobile-optimized touch interactions, responsive design patterns, and native app-like features such as splash screens and home screen installation.

## Data Visualization
The application includes analytics features with chart components using Recharts library. It supports trend analysis, pattern recognition, and dream theme visualization. The analytics system processes dream data to identify recurring patterns and psychological insights.

## Security and Authentication
Basic session management is implemented with plans for user authentication. The system includes CORS configuration, input validation using Zod schemas, and secure file upload handling with size limits and type validation.

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL hosting service configured through DATABASE_URL environment variable
- **Drizzle ORM**: Type-safe database access layer with PostgreSQL dialect

## AI and Machine Learning
- **OpenAI API**: GPT-4o model for dream analysis and Whisper API for audio transcription
- **API Key Management**: Requires OPENAI_API_KEY environment variable

## UI and Styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Radix UI**: Headless UI components for accessibility and interaction patterns
- **Lucide Icons**: Icon library for consistent visual elements

## Development and Build Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundling for production builds
- **Replit Integration**: Development environment specific plugins and configurations

## Data Handling and Visualization
- **React Query**: Server state management and caching
- **Recharts**: Chart library for data visualization
- **date-fns**: Date manipulation and formatting utilities
- **Zod**: Runtime type validation and schema definition

## Audio and Media Processing
- **Multer**: File upload middleware for Express.js
- **Web Audio API**: Browser-native audio recording capabilities
- **MediaRecorder API**: Audio stream recording and processing

## PWA and Mobile Features
- **Service Worker**: Caching and offline functionality implementation
- **Web App Manifest**: PWA configuration and metadata
- **Framer Motion**: Animation library for enhanced user interactions