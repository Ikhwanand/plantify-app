from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from ninja_jwt.tokens import RefreshToken

User = get_user_model()


async def register_user(name: str, email: str, password: str) -> tuple[User, str, str]:
    user = await sync_to_async(User.objects.create_user, thread_sensitive=True)(
        email=email,
        password=password,
        first_name=name,
    )
    refresh = RefreshToken.for_user(user)
    return user, str(refresh.access_token), str(refresh)


async def login_user(email: str, password: str) -> tuple[User, str, str]:
    user = await sync_to_async(User.objects.filter(email=email).first, thread_sensitive=True)()
    if not user or not user.check_password(password):
        raise ValueError("Invalid credentials")
    refresh = RefreshToken.for_user(user)
    return user, str(refresh.access_token), str(refresh)

