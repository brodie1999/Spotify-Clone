    # 🎵 Spotify Clone - Full-Stack Music Streaming Platform
<div align="center">
Show Image
Show Image
Show Image
Show Image
Show Image
Show Image

A feature-rich music streaming application with YouTube integration, real-time audio analysis, and modern UI/UX

Live Demo • API Documentation • Video Walkthrough 

</div>

    📑 Table of Contents

        🌟 Features

        🏗️ Architecture

        🛠️ Technology Stack

        🚀 Quick Start

        ⚙️ Installation & Setup

        📸 Screenshots

        🔧 Configuration

        🧪 Testing

        🚀 Deployment

        📚 API Documentation

📄 License

# 🌟 Features

    🎤 Core Music Features

    🎵 Audio Streaming - High-quality music playback with seek controls
    
    📁 File Upload - Support for MP3, WAV, FLAC, M4A, OGG formats
    
    🎨 Album Artwork - Custom artwork upload and display
    
    ⏭️ Playlist Controls - Play, pause, skip, repeat, shuffle modes
    
    🔊 Volume Control - Smooth volume adjustment with visual feedback
    
    🎯 Advanced Features
    🔍 YouTube Integration - Search and stream music directly from YouTube
    
    📊 Audio Analysis - Real-time tempo, key, genre, and mood detection
    
    🎵 Smart Playlists - Automatic playlist generation based on audio features
    
    💚 Liked Songs - Personal favorites collection
    
    📱 Responsive Design - Works seamlessly on desktop and mobile
    
    🔐 User Management
    
    🔑 JWT Authentication - Secure user registration and login
    
    👤 User Profiles - Personal music libraries and preferences
    
    🔒 Password Security - Bcrypt hashing with strength validation
    
    🎯 Role-based Access - Protected routes and user-specific content


# 🏗️ Architecture
# System Architecture Overview

        Frontend (React + TypeScript)        
        ├── User Interface Components        
        ├── State Management (Context API)        
        ├── Audio Player Controls         
        └── API Communication Layer
                                    ↕ HTTP/REST API

## Backend (FastAPI + Python)
    
    ├── Authentication & Authorization    
    ├── RESTful API Endpoints    
    ├── Business Logic Layer    
    ├── Database ORM (SQLModel)    
    └── External Service Integration
    
                        ↕ SQL Queries
    
## Database (PostgreSQL)
    
    ├── User Management    
    ├── Playlist & Song Metadata    
    ├── Audio Analysis Results    
    └── Relationships & Indexes


## External Services

    ├── YouTube Data API v3 (Music Discovery)    
    ├── yt-dlp (Audio Stream Extraction)    
    └── Librosa (Audio Analysis)

# Data Flow Architecture
    [User Interaction] 
           ↓
    [React Components] 
           ↓
    [Context API State] 
           ↓
    [Axios HTTP Client] 
           ↓
    [FastAPI Endpoints] 
           ↓
    [Business Logic Services] 
           ↓
    [SQLModel Database Layer] 
           ↓
    [PostgreSQL Database]


## External Integrations:
    [YouTube API] ←→ [Backend Services] ←→ [Audio Analysis]

Component Overview
## Frontend Architecture:
    src/
    ├── components/           # Reusable UI components
    │   ├── Audio/           # Audio player components
    │   ├── Dashboard/       # Main dashboard
    │   ├── Playlist/        # Playlist management
    │   └── YouTube/         # YouTube integration
    ├── contexts/            # React Context providers
    ├── services/            # API communication
    └── utils/               # Helper functions

## Backend Architecture:
    
    app/backend/
    ├── routes/              # API endpoint definitions
    ├── services/            # Business logic layer
    ├── models/              # Database models
    ├── schemas/             # Pydantic schemas
    └── config.py           # Configuration management


🛠️ Technology Stack

## Frontend

    -> React 18: UI Framework	Component-based architecture, large ecosystem
    
    -> TypeScript:	Type Safety	Better developer experience, fewer runtime errors
    
    -> Context API	State Management: Built-in React solution, perfect for medium complexity
    
    -> Axios: HTTP Client	Interceptors for auth, better error handling

## Backend

    -> FastAPI	Web Framework	High performance, automatic API docs, async support
    
    -> SQLModel	ORM	Type-safe database operations, Pydantic integration
    
    -> PostgreSQL	Database	ACID compliance, JSON support, scalability
    
    -> JWT	Authentication	Stateless authentication

Audio Processing:

    -> Librosa	Audio Analysis	Industry-standard audio processing library
    -> Mutagen	Metadata Extraction	Comprehensive audio file metadata support
    -> yt-dlp	YouTube Audio	Reliable YouTube audio stream extraction

# DevOps & Tools
    Docker	Containerization	Consistent development and deployment environments
    Alembic	Database Migrations	Version control for database schema changes
    🚀 Quick Start
    Prerequisites: 
    
        Python 3.11+
        Node.js 18+
        PostgreSQL 13+
    
    Docker (optional)
    🐳 Option 1: Docker Setup (Recommended)
    bash
    # Clone the repository
    git clone https://github.com/yourusername/spotify-clone.git
    cd spotify-clone
    
    # Create environment file
    cp .env.example .env
    # Edit .env with your configuration
    
    # Start all services
    docker-compose up --build
    
    # Access the application
    # Frontend: http://localhost:3000
    # Backend API: http://localhost:8002
    # API Docs: http://localhost:8002/docs
    💻 Option 2: Local Development Setup
    bash
    # 1. Clone and setup
    git clone https://github.com/yourusername/spotify-clone.git
    cd spotify-clone
    
    # 2. Backend setup
    cd app/backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    
    # 3. Database setup
    createdb spotify_clone
    # Copy and edit environment variables
    cp .env.example .env
    
    # 4. Run backend
    uvicorn app.main:app --reload --port 8002
    
    # 5. Frontend setup (new terminal)
    cd app/frontend
    npm install
    npm start
    
    # Access: http://localhost:3000


⚙️ Installation & Setup
# 1. Environment Configuration
    Create .env file in the backend directory:
    # Database
        DATABASE_URL=postgresql://username:password@localhost:5432/spotify_clone    
        DB_HOST=localhost    
        DB_PORT=5432    
        DB_NAME=spotify_clone    
        DB_USER=your_username    
        DB_PASSWORD=your_password


# 2. JWT Configuration
    JWT_SECRET_KEY=your-super-secret-jwt-key-here    
    JWT_ALGORITHM=HS256    
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30


# 3. External APIs
    YOUTUBE_API_KEY=your-youtube-api-key-here

# 4. Application Settings
    DEBUG=True    
    ENVIRONMENT=development    
    API_HOST=localhost    
    API_PORT=8002


# 5. Security
    BCRYPT_ROUNDS=12
    MIN_PASSWORD_LENGTH=8
    MAX_PASSWORD_LENGTH=128

# 6. Database Setup

    # Create database
    createdb spotify_clone
    
    # Run migrations (if using Alembic)
    cd app/backend
    alembic upgrade head
    
    # Or let the app create tables automatically
    python -c "from app.backend.db import init_db; init_db()"

# 7. YouTube API Setup

    1. Go to Google Cloud Console    
    2. Create a new project or select existing    
    3. Enable YouTube Data API v3    
    4. Create credentials (API Key)    
    5. Add the API key to your .env file


# 8. Development Tools Setup

    1. Install development dependencies
        pip install -r requirements-dev.txt
        npm install -D
    
    2. Setup pre-commit hooks
        pre-commit install
    
    3. Run tests
        pytest                    # Backend tests
        npm test                  # Frontend tests
    
    📸 Screenshots
    Note: (Coming Soon)

# 🏠 Dashboard
Main dashboard showing playlists and trending music

### Key Features Shown:

    -> Modern dark theme UI
    -> Sidebar navigation with playlists
    -> Trending music from YouTube
    -> Quick action cards

## 🎵 Music Player
Bottom music player with full controls

### Features Demonstrated:

    -> Custom audio player controls
    -> Progress bar with seek functionality
    -> Volume control
    -> Repeat and shuffle modes
    -> Current song information

## 🔍 Music Discovery
YouTube music search and discovery

### Capabilities Shown:
    
    -> Real-time YouTube music search
    
    -> Trending music recommendations
    
    -> Add to playlist functionality
    
    -> Song preview and metadata

# User Registration & Login Flow

    -> GIF showing signup process and immediate login
    Playlist Creation & Management
    
    -> GIF demonstrating creating a playlist and adding songs
    YouTube Music Integration
    
    -> GIF showing search, preview, and adding YouTube songs
    Audio Analysis in Action
    
    -> GIF showing real-time audio analysis results
    Responsive Design Demo
    
    -> GIF showing the app transitioning between desktop and mobile views

# 🔧Configuration
Backend Configuration

### The application uses a hierarchical configuration system:

python
### Configuration priority (highest to lowest):
1. Environment variables
2. .env file
3. Default values in config.py

Key Configuration Options:

    Variable	        Description	                Default	Required
    DATABASE_URL	    PostgreSQL connection string		 ✅
    JWT_SECRET_KEY	    Secret for JWT token signing		 ✅
    YOUTUBE_API_KEY	    YouTube Data API v3 key		         ✅
    DEBUG	            Enable debug mode		                 ❌
    BCRYPT_ROUNDS	    Password hashing rounds	12	         ❌

## Frontend Configuration
Environment variables for React (.env in frontend directory):

## API Configuration
    REACT_APP_API_BASE=http://localhost:8002

## Feature Flags
    REACT_APP_ENABLE_YOUTUBE=true
    REACT_APP_ENABLE_ANALYTICS=false

## Development
    GENERATE_SOURCEMAP=false
    DISABLE_ESLINT_PLUGIN=false

# 🧪 Testing
### Backend Tests
    bash
    cd app/backend
    
    # Run all tests
    pytest
    
    # Run with coverage
    pytest --cov=app --cov-report=html
    
    # Run specific test categories
    pytest tests/test_auth.py          # Authentication tests
    pytest tests/test_playlists.py     # Playlist functionality
    pytest tests/test_youtube.py       # YouTube integration
    
### Frontend Tests
    
    cd app/frontend
    
    # Run all tests
    npm test
    
    # Run with coverage
    npm test -- --coverage --watchAll=false
    
    # Run specific test suites
    npm test -- --testPathPattern=components/Audio
    npm test -- --testPathPattern=contexts
    Integration Tests
    
    # End-to-end testing with Docker
    docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
    
    # API integration tests
    pytest tests/integration/
    Test Coverage Goals
    Backend: > 85% coverage
    Frontend: > 80% coverage
    Integration: All critical user flows

# 🚀 Deployment
    
1. Using Docker Compose

        docker-compose -f docker-compose.dev.yml up --build
    
## Manual Setup
    1. Backend
    cd app/backend && uvicorn app.main:app --reload --port 8002
    
    2. Frontend  
    cd app/frontend && npm start
    
## Production Deployment

    Option 1: AWS Deployment
        
    1. Deploy infrastructure
        cd terraform
        terraform init && terraform apply

    2. Deploy application
        aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.region.amazonaws.com
        docker build -t spotify-clone .
        docker push <account>.dkr.ecr.region.amazonaws.com/spotify-clone:latest
    
    Option 2: Digital Ocean/Railway
    
    1. Using included Dockerfile
        docker build -t spotify-clone .    
        docker run -p 80:80 -p 8002:8002 spotify-clone
    
## Environment-Specific Configurations
    Environment Database	           Debug	        SSL Scaling

    Development Local PostgreSQL	    ✅	            ❌ Single instance
    
    Staging	Cloud RDS	            ❌	            ✅ 2 instances
    
    Production Cloud RDS Multi-AZ	    ❌	            ✅  Auto-scaling

# 📚 API Documentation
Interactive API Docs
    
    Swagger UI: http://localhost:8002/docs
    
    ReDoc: http://localhost:8002/redoc


# Key Endpoints
### 🔐 Authentication

    POST /auth/register          # User registration
    
    POST /auth/login            # User login  
    
    GET  /auth/users/me         # Get current user
    
    POST /auth/validate-password # Password strength validation

### 🎵 Music Management

    GET    /api/songs           # List all songs
    POST   /api/songs/upload    # Upload audio file
    GET    /api/songs/{id}      # Get song details
    GET    /api/songs/{id}/stream # Stream audio
    GET    /api/songs/{id}/analysis # Get audio analysis
### 📁 Playlist Operations

    GET    /api/playlists       # User's playlists
    POST   /api/playlists       # Create playlist
    GET    /api/playlists/{id}  # Playlist details
    PUT    /api/playlists/{id}  # Update playlist
    DELETE /api/playlists/{id}  # Delete playlist
    POST   /api/playlists/{id}/tracks # Add song to playlist
### 🔍 YouTube Integration

    GET  /api/discover/youtube/search     # Search YouTube music
    GET  /api/discover/youtube/trending   # Get trending music
    GET  /api/discover/youtube/audio/{id} # Get audio stream URL
    POST /api/discover/youtube/add-to-playlist # Add YouTube song to playlist
### Authentication
All protected endpoints require JWT token in Authorization header:

    Authorization: Bearer <your-jwt-token>

# Development Workflow

    Fork the repository

    Create a feature branch (git checkout -b feature/amazing-feature)

    Commit your changes (git commit -m 'Add amazing feature')

    Push to the branch (git push origin feature/amazing-feature)

    Open a Pull Request

    Code Standards

    Backend: Follow PEP 8, use type hints, docstrings for functions

    Frontend: ESLint + Prettier configuration, TypeScript strict mode

    Tests: Minimum 80% coverage for new features

    Commits: Use conventional commit messages

### Development Setup for Contributors
    1. Install development tools
    pip install -r requirements-dev.txt
    npm install -D
    
    # Setup pre-commit hooks
    pre-commit install
    
    # Run quality checks
    black .                    # Format Python code
    flake8 .                   # Lint Python code
    npm run lint              # Lint TypeScript/React
    npm run type-check        # TypeScript checking

### 📈 Performance & Monitoring

    **Performance Metrics**:
    Audio Streaming: < 2s initial load time
    
    API Response: < 200ms average response time
    
    Database Queries: Optimized with indexes and query analysis
    
    Frontend Bundle: < 500KB gzipped

### Monitoring Stack

    Backend: FastAPI built-in metrics + custom health checks
    
    Database: PostgreSQL query performance monitoring
    
    Frontend: React DevTools and performance profiler
    
    Infrastructure: CloudWatch (AWS) or equivalent monitoring


# 🔒 Security

Security Measures Implemented

    🔐 Authentication: JWT with secure secret rotation
    
    🔒 Password Security: Bcrypt hashing with strength validation
    
    🛡️ Input Validation: Pydantic schemas for all API inputs
    
    🚫 CORS: Configured for specific allowed origins
    
    📁 File Upload: Type validation and size limits
    
    🔍 SQL Injection: SQLModel ORM protection
    
    🌐 XSS Protection: React's built-in XSS protection

### Security Best Practices:

    -> Secrets stored in environment variables
    -> Regular dependency updates
    -> Input sanitization
    -> Rate limiting (planned)
    -> SSL/HTTPS in production

### 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

# 🙏 Acknowledgments
    FastAPI team for the excellent web framework
    
    React community for comprehensive ecosystem
    
    YouTube API for music discovery capabilities
    
    Librosa contributors for audio analysis tools
    
    Open Source community for making this project possible


Project Link: https://github.com/brodie1999/spotify-clone

Live Demo: (COMING SOON)

⭐ Star this repository if you found it helpful!
