from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from catalog.models import Track
from core.exceptions import PlaylistLimitExceeded
from core.tiers import can_create_playlist

from .models import Notification, Playlist, PlaylistTrack
from .serializers import (
    NotificationSerializer,
    PlaylistSerializer,
    RecentItemSerializer,
)
from .services import add_recent, record_stream, today_stream_count


class PlaylistViewSet(ModelViewSet):
    serializer_class = PlaylistSerializer

    def get_queryset(self):
        qs = Playlist.objects.all()
        owner = self.request.query_params.get("owner")
        if owner:
            if owner != self.request.user.id and self.request.user.role not in (
                "support", "admin"):
                raise PermissionDenied()
            qs = qs.filter(owner_id=owner)
        elif self.request.user.role not in ("support", "admin"):
            qs = qs.filter(owner=self.request.user)
        return qs

    def _owned(self):
        playlist = self.get_object()
        if playlist.owner_id != self.request.user.id and self.request.user.role not in (
            "support", "admin"):
            raise PermissionDenied()
        return playlist

    def create(self, request):
        count = Playlist.objects.filter(owner=request.user).count()
        if not can_create_playlist(request.user.effective_tier, count):
            raise PlaylistLimitExceeded()
        playlist = Playlist.objects.create(
            name=request.data.get("name", "").strip() or "پلی‌لیست جدید",
            owner=request.user,
        )
        return Response(PlaylistSerializer(playlist).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        playlist = self._owned()
        if "name" in request.data:
            playlist.name = request.data["name"]
        playlist.updated_at = timezone.now()
        playlist.save()
        return Response(PlaylistSerializer(playlist).data)

    def destroy(self, request, pk=None):
        self._owned().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["put", "delete"],
            url_path="tracks/(?P<track_id>[^/]+)")
    def track(self, request, pk=None, track_id=None):
        playlist = self._owned()
        if request.method == "PUT":
            if not Track.objects.filter(id=track_id).exists():
                raise NotFound("اثر یافت نشد.")
            if not playlist.items.filter(track_id=track_id).exists():
                next_pos = playlist.items.count()
                PlaylistTrack.objects.create(
                    playlist=playlist, track_id=track_id, position=next_pos
                )
        else:
            playlist.items.filter(track_id=track_id).delete()
        playlist.updated_at = timezone.now()
        playlist.save(update_fields=["updated_at"])
        return Response(PlaylistSerializer(playlist).data)


class NotificationViewSet(ModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def partial_update(self, request, pk=None):
        notification = self.get_object()
        if "read" in request.data:
            notification.read = bool(request.data["read"])
            notification.save(update_fields=["read"])
        return Response(NotificationSerializer(notification).data)

    def destroy(self, request, pk=None):
        self.get_object().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, url_path="unread-count")
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, read=False).count()
        return Response({"count": count})

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, read=False).update(read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


class StreamView(APIView):
    """POST /streams — record a play, enforcing the daily cap server-side."""

    def post(self, request):
        today = record_stream(request.user, request.data.get("track_id"))
        return Response({"today_count": today}, status=status.HTTP_201_CREATED)


class TodayStreamCountView(APIView):
    def get(self, request):
        return Response({"count": today_stream_count(request.user)})


class RecentsView(APIView):
    def get(self, request):
        items = request.user.recents.all()
        return Response(RecentItemSerializer(items, many=True).data)

    def post(self, request):
        add_recent(request.user, request.data.get("kind", "track"),
                   request.data.get("ref_id"))
        return Response(status=status.HTTP_201_CREATED)
