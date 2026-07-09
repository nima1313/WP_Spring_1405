from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AlbumViewSet, BrowseView, TrackViewSet

router = DefaultRouter(trailing_slash=False)
router.register("tracks", TrackViewSet, basename="track")
router.register("albums", AlbumViewSet, basename="album")

urlpatterns = [
    path("browse", BrowseView.as_view()),
    path("", include(router.urls)),
]
