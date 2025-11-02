from ninja import Schema
from pydantic import EmailStr


class AuthResponse(Schema):
    accessToken: str 
    refreshToken: str | None = None 
    user: "UserSchema"
    

class UserSchema(Schema):
    id: int
    name: str | None = None 
    email: EmailStr 