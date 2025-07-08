from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session, select
from app.backend.db import get_db
from app.backend.models.models import User
from app.backend.schemas.auth import TokenData
from backend.services.auth import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try :
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ ALGORITHM ])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    stmt = select(User).where(User.username == token_data.username)
    result = db.exec(stmt).first()
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception
    return user