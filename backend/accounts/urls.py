from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ArtistViewSet,
    LoginView,
    LogoutView,
    MeAvatarView,
    MeSettingsView,
    MeView,
    RegisterArtistView,
    RegisterListenerView,
    UserViewSet,
    VerificationViewSet,
)

router = DefaultRouter(trailing_slash=False)
router.register("users", UserViewSet, basename="user")
router.register("artists", ArtistViewSet, basename="artist")
router.register("verifications", VerificationViewSet, basename="verification")

urlpatterns = [
    path("auth/login", LoginView.as_view()),
    path("auth/logout", LogoutView.as_view()),
    path("auth/register/listener", RegisterListenerView.as_view()),
    path("auth/register/artist", RegisterArtistView.as_view()),
    path("me", MeView.as_view()),
    path("me/avatar", MeAvatarView.as_view()),
    path("me/settings", MeSettingsView.as_view()),
    path("", include(router.urls)),
]
