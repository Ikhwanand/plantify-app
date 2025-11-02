from ninja import Schema
from pydantic import EmailStr
from ninja_extra.controllers import ControllerBase, api_controller, route
from ninja_extra import status
from ninja_extra.exceptions import AuthenticationFailed, ValidationError
from ninja_jwt.authentication import AsyncJWTAuth
from ninja_extra.permissions import IsAuthenticated
from asgiref.sync import sync_to_async

from .schemas import AuthResponse, UserSchema
from .service import register_user, login_user


class RegisterPayload(Schema):
    name: str
    email: EmailStr
    password: str 
    

class LoginPayload(Schema):
    email: EmailStr
    password: str 


class MessageOut(Schema):
    message: str 
    status: int 
    
@api_controller("/auth", tags=["Authentication"])
class AuthController(ControllerBase):
    @route.post("/register", response=AuthResponse)
    async def register(self, payload: RegisterPayload):
        try:
            user, access, refresh = await register_user(
                name=payload.name.strip(),
                email=payload.email.lower().strip(),
                password=payload.password,
            )
        except Exception as exc:
            raise ValidationError(str(exc))

        return AuthResponse(
            accessToken=access,
            refreshToken=refresh,
            user=UserSchema(id=user.id, name=user.first_name, email=user.email),
        )

    @route.post("/login", response=AuthResponse)
    async def login(self, payload: LoginPayload):
        try:
            user, access, refresh = await login_user(
                email=payload.email.lower().strip(),
                password=payload.password,
            )
        except Exception as exc:
            raise AuthenticationFailed(str(exc))

        return AuthResponse(
            accessToken=access,
            refreshToken=refresh,
            user=UserSchema(id=user.id, name=user.first_name, email=user.email),
        )

    @route.get("/me", auth=AsyncJWTAuth(), response=UserSchema)
    async def me(self):
        user = self.context.request.user
        return UserSchema(id=user.id, name=user.first_name, email=user.email)

    @route.delete("/delete-account", auth=AsyncJWTAuth(), permissions=[IsAuthenticated], response=MessageOut)
    async def delete_account(self):
        user = self.context.request.user
        await sync_to_async(user.delete, thread_sensitive=True)()
        return MessageOut(message="Akun pengguna berhasil dihapus.", status=status.HTTP_204_NO_CONTENT)