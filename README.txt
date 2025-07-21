1. Design & Persist Data Model (COMPLETE)

Using alembic & sqlAlchemy to ensure dynamic updates to our database.
Allowing for smooth updates to our database from the backend.

Migrations:
    NOTE ON HOW TO MIGRATE TO POSTGRES:
        1. Use the command "alembic init alembic" this will create an initial alembic migration folder that can be edited.
            1.1. In "Script.py.mako" make sure to import our SQLModel using "import sqlmodel"
        2. In "alembic.ini" connect to the database (for me, it's postgres)
        3. In "env.py" import models and SQLModel. set "target_metadata = SQLModel.metadata"
        4. Run the command "alembic revision --autogenerate -m "Commit message" "

    When changing our models in the future we simply will update them using the same method in step 4.

Step 2. Implement Authentication & Authorization (Login & registration) COMPLETE

    2.1 - Create a user login, logout & registration page
        TASKS:
            1. In this section, using "/auth/routes" this will house our login and registration functionality (WORKING)
            2. Implement login routes (COMPLETE)
            3. Connect login & registration functionality to frontend using TypeScript & Tailwind (COMPLETE)

    2.2 - This will include passwords that are hashed when created (COMPLETE)
    2.3 - Include endpoints: POST /auth/register, POST /auth/login (COMPLETE)
    2.4 - Issue JWTs with Python-jose. (Json Web Tokens) (COMPLETE)
    2.5 - Protect our Routes (COMPLETE)
    2.6 - create a get_current_user dependency that reads the Authorization: Bearer <token> header. (COMPLETE)
    2.7 - Apply Depends(get_curren_user) to any endpoint that needs an authenticated user (COMPLETE)

3. CRUD Endpoints for Core Resources (COMPLETE)

    Songs:
        - GET /songs (browse)
        - GET /songs/{id} (detail)

    Playlists:
        - GET /playlists (user’s lists)
        - POST /playlists (create)
        - GET /playlists/{id} (detail + tracks)
        - PUT /playlists/{id} (rename)
        - DELETE /playlists/{id}

    Playlist Tracks:
        - POST /playlists/{id}/tracks

    Liked Songs:
        - GET /me/liked
        - POST /me/liked/{song_id}
        - DELETE /me/liked/{song_id}

Use Pydantic models for request/response validation.

4. Spotify Web API Integration (COMPELTE) -

NOTE: Decided to use YouTube API as it allows you to play songs fully rather than the offered 30 seconds from spotify

    OAuth Flow

        - Endpoint GET /auth/spotify → redirect to Spotify’s auth page.
        - Callback GET /auth/spotify/callback → exchange code for tokens, store in user record.

    Import Playlists

        - Endpoint POST /spotify/import
        - Use spotipy or raw HTTP to fetch user’s Spotify playlists & tracks, then upsert into your DB.

    Keep Tokens Fresh

        - Store refresh_token, implement token-refresh logic in a background task or on-demand.

5. Smart Shuffle Service

    Algorithm Design

        - Pre-shuffle the list once per session & cache it (Redis?)
        - Track “played” indexes, cycle through until exhausted
        - Optionally generate multiple “sets” ahead of time to avoid repeats

    Endpoints:
        - GET /playlists/{id}/shuffle/next → returns the next track

6. Testing, Validation & Documentation

    Automated Tests:
        - Unit tests for services (shuffle logic, Spotify integration) using pytest.
        - Integration tests for endpoints using httpx.AsyncClient.

    API Docs:
        - FastAPI auto-docs at /docs and /redoc—add descriptions, example payloads.

    Data Validation:
        - Use Pydantic’s Field(..., regex=…), comint(), etc., to guard against bad data.

7. Optimization & Scaling (LOADING...)

    Code Refactor:
        - Replace all hardcoded credentials
        - Implement proper password validation
        - Add file validation with python-magic
        - Set up security headers middleware
        - Add rate limiting.

    Critical Security Issues:
        - Hardcoded credentials in source code (I know this is bad practice, looking to get this sorted asap)
        - Weak JWT secrets
        - Add file validation
        - Rate Limiting: Protect my API from abuse (e.g., via slowapi or API Gateway).

    Project Structure Reorganization:
        - Implement Repository Pattern
            1. Create base repositories
            2. Implement specific repositories (User, Song, Playlist)
            3. Remove direct database access from routes
        - Service layer implementation
            1. Create service class for business logic
            2. Move complex logic from routes to services
            3. implement proper error handling.
        - Database Optimizations

    API Improvements:
        - Enhanced Schemas
            1. Add proper validation with Pydantic
            2. Implement request/response models
            3. Add comprehensive API documentation
        - Error Handling
            1. Create custom exception classes
            2. Implementation global exception handler
            3. Add proper error responses
        - Versioning
            1. Move routes to "/api/v1/"
            2. Implement API versioning strategy
            3. Add deprecation notices for old endpoints

    Frontend Improvements:
        - TypeScript & Type Safety
        - Architecture Improvements
            1. Centralize API client
            2. Implement custom hooks
            3. Add error boundaries
            4. Create reusable components
        - Performance Optimizations
            1. Implement lazy loading
            2. Add caching strategies (Redis & cache frequent reads (playlist metadata)
            3. Optimize bundle size
            4. Add loading states
    Testing:
        - Backend Testing
        - Test Implementation
            1. Unit tests for services
            2. Integration tests for API endpoints
            3. Database tests with fixtures
            4. Authentication tests
        - Frontend Testing

    Monitoring & Performance
        - Monitoring setup
            1. Add prometheus metrics
            2. Implement health checks
            3. Set up logging configuration
            4. Add performance middleware
        - Caching Layer (Redis)
        - Background tasks
            1. Set up celery for background processing
            2. Move audio analysis to background tasks
            3. Implement task monitoring
    Deployment
        - Containerization (Docker)
        - Production setup
            1. Setup reverse proxy (Nginx)
            2. Configure SSL certificates
            3. Set up database backups
            4. configure log rotation

        CI/CD Pipeline
            - Using github/workflows/ci.yml


🎯 Immediate Actions (Priority Order)

    Week 1: Fix security issues (environment config, file validation)
    Week 2-3: Refactor architecture (repositories, services)
    Week 4: Add proper API validation and documentation
    Week 5-6: Implement comprehensive testing
    Week 7-8: Set up monitoring and production deployment



