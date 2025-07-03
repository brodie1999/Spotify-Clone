So Far:
    - Developed file structure for the api into frontend containing React and typescript. Backend, containing Python
    - Setup routes and classes that contain songs, user and playlist

TO-DO: 

     1. DESIGN AND PERSIST DATA MODEL 
        - Using Postgres with SQLAlchemy 
        - Define Schemes (Users, Songs, Playlists & PlaylistSongs)
        - Using Alembic for schema evolution 
    2. IMPLEMENT AUTHEMTICATION & AUTHORIZATION 
        - Registration & Login 
        - Endpoints: POST /auth/register, POST /auth/login 
        - Passwords hased with bcrypt (passlib)
        - Issue JWTs with python-jose 
        - Protect Routes 
    3. CRUD ENDPOINTS FOR CORE RESOURCES 
        - Use Pydantic models for request/response validation 

    4. SPOTIFY WEB API INTEGRATION
        - OAuth Flow 
        - Import Playlists 
        - Keep tokens Fresh 
    5. SMART SHUFFLE SERVICE 
        - Pre-shuffle the list once per session & cache it (Redis??)
        - Track playued indexes, cycle through until exhausted 
        - Optionally generate multiple "sets" ahead of time to avoid repeats 
    6. TESTING, VALIDATION & DOCUMENTATION
        - automated tests 
        - Unit tests for services (Shuffle logic, Spotify integration) using pytest 
        - Integration tests for endpoints using httpx.AsyncClient. 
        - API Docs
        - FastAPI auto-docs at /docs and /redoc-add descriptions, example payloads 
        - Data Validation 
        - Using regex to gaurd against bad data
    7. OPTIMIZATION & SCALING 
