"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import AsyncNinjaJWTDefaultController
from django.conf.urls.static import static
from django.conf import settings

from users.api import AuthController
from vision.api import VisionController
from diagnosis.api import DiagnosisController
from logs.api import LogbookController, ReminderController
from community.api import CommunityController
from dashboard.api import DashboardController

api = NinjaExtraAPI(title="Plantify API", version="1.0.0")

api.register_controllers(AsyncNinjaJWTDefaultController)
api.register_controllers(
    AuthController,
    VisionController,
    DiagnosisController,
    LogbookController,
    ReminderController,
    CommunityController,
    DashboardController,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", api.urls),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
