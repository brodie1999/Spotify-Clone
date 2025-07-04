from sqlalchemy import Column, Integer, String
from app.backend.db import Base

class User(Base):
    id = Column(Integer, primary_key=True, index=False)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    spotify_token = Column(String, nullable=False)