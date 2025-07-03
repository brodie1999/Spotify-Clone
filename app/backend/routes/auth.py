from fastapi import FastAPI, APIRouter

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/login")
def login():
    return {"token" : "mock_token"}