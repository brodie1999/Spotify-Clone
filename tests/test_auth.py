import sys, os
import pytest
from httpx import AsyncClient
#from app.main import app

# Ensure the project root (parent of these tests/ folder) is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.mark.asyncio
async def test_register_and_login():
    async with AsyncClient(base_url="http://testserver") as client:
        # 1. Register a test user
        response = await client.post(
            "/auth/register",
            json={"username" : "testuser", "email" : "test@example.com", "password": "secret123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

        # 2. Login with new user
        response = await client.post(
            "/auth/login",
            json={"username" : "testuser", "password": "secret123"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["token_type"] == "Bearer"
        assert "access_token" in data

        # 3. Access protected route
        token = data["access_token"]
        response = await client.get(
            "/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["username"] == "testuser"


