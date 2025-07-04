from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id : int
    username: str
    email: EmailStr

    class config:
        orm_mode = True