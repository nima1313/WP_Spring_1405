from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    NotificationViewSet,
    PlaylistViewSet,
    RecentsView,
    StreamView,
    TodayStreamCountView,
)

router = DefaultRouter(trailing_slash=False)
router.register("playlists", PlaylistViewSet, basename="playlist")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("streams", StreamView.as_view()),
    path("me/streams/today", TodayStreamCountView.as_view()),
    path("me/recents", RecentsView.as_view()),
    path("", include(router.urls)),
]
