from django.db.models import Q
from django.http import FileResponse, Http404, HttpResponseRedirect
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from core.tiers import config_for

from .models import Album, Track
from .serializers import AlbumSerializer, TrackSerializer
from .services import publish_work, visible_tracks


def _bool(value) -> bool:
    return str(value).lower() in ("1", "true", "yes", "on")


class TrackViewSet(ModelViewSet):
    serializer_class = TrackSerializer

    def get_queryset(self):
        qs = visible_tracks(self.request.user)
        params = self.request.query_params
        if params.get("ids"):
            qs = qs.filter(id__in=[i for i in params["ids"].split(",") if i])
        if params.get("artist"):
            artist_id = params["artist"]
            qs = qs.filter(Q(artist_id=artist_id) | Q(featured_artists__id=artist_id))
        if params.get("type"):
            qs = qs.filter(type=params["type"])
        return qs.distinct()

    def _owned_track(self):
        track = self.get_object()
        artist = getattr(self.request.user, "artist", None)
        if not artist or track.artist_id != artist.id:
            raise PermissionDenied("این اثر متعلق به شما نیست.")
        return track

    def create(self, request):
        """publishWork — multipart upload by a verified artist."""
        artist = getattr(request.user, "artist", None)
        if request.user.role != "artist" or artist is None:
            raise PermissionDenied("فقط هنرمندان می‌توانند اثر منتشر کنند.")
        if not artist.verified:
            raise PermissionDenied("حساب هنرمندی شما هنوز تأیید نشده است.")

        title = request.data.get("title", "").strip()
        if not title:
            raise ValidationError({"detail": "عنوان اثر الزامی است."})
        featured = request.data.get("featured_artist_ids") or []
        if isinstance(featured, str):
            featured = [f for f in featured.split(",") if f]

        track = publish_work(
            artist=artist,
            title=title,
            release_type=request.data.get("type", "single"),
            genre=request.data.get("genre", ""),
            lyrics=request.data.get("lyrics", ""),
            featured_ids=featured,
            audio_file=request.FILES.get("audio"),
            cover_file=request.FILES.get("cover"),
            source_url=request.data.get("source_url", ""),
        )
        return Response(TrackSerializer(track).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        track = self._owned_track()
        for field in ("title", "lyrics", "genre"):
            if field in request.data:
                setattr(track, field, request.data[field])
        if "early_access" in request.data:
            track.early_access = _bool(request.data["early_access"])
        if request.FILES.get("cover"):
            track.cover = request.FILES["cover"]
        track.save()
        return Response(TrackSerializer(track).data)

    def destroy(self, request, pk=None):
        track = self._owned_track()
        track.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        """§3.4 tier-gated download."""
        if not config_for(request.user.effective_tier).can_download:
            raise PermissionDenied("دانلود مخصوص اشتراک نقره‌ای و طلایی است.")
        track = self.get_object()
        if track.audio:
            response = FileResponse(track.audio.open("rb"), as_attachment=True,
                                    filename=f"{track.title}.{track.audio.name.split('.')[-1]}")
            return response
        if track.source_url:
            return HttpResponseRedirect(track.source_url)
        raise Http404("فایلی برای این اثر موجود نیست.")


class AlbumViewSet(ModelViewSet):
    serializer_class = AlbumSerializer

    def get_queryset(self):
        qs = Album.objects.all()
        if self.request.query_params.get("artist"):
            qs = qs.filter(artist_id=self.request.query_params["artist"])
        return qs

    def _owned_album(self):
        album = self.get_object()
        artist = getattr(self.request.user, "artist", None)
        if not artist or album.artist_id != artist.id:
            raise PermissionDenied("این آلبوم متعلق به شما نیست.")
        return album

    def destroy(self, request, pk=None):
        album = self._owned_album()
        album.tracks.all().delete()  # cascade tracks, matching phase-1 behaviour
        album.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="tracks")
    def add_track(self, request, pk=None):
        album = self._owned_album()
        track_id = request.data.get("track_id")
        track = Track.objects.filter(id=track_id, artist=album.artist).first()
        if not track:
            raise ValidationError({"detail": "اثر یافت نشد."})
        next_pos = (album.tracks.count())
        track.album = album
        track.position = next_pos
        track.save(update_fields=["album", "position"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class BrowseView(APIView):
    """
    §8.2 archive: search by track OR artist name, sort by listeners / date.
    Artist names are joined server-side (no client-side pre-fetch needed).
    """

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        sort = request.query_params.get("sort") or "date"
        order = "-listeners" if sort == "listeners" else "-release_date"

        tracks = visible_tracks(request.user)
        albums = Album.objects.all()
        if q:
            tracks = tracks.filter(Q(title__icontains=q) | Q(artist__name__icontains=q))
            albums = albums.filter(Q(title__icontains=q) | Q(artist__name__icontains=q))

        singles = tracks.filter(type="single").order_by(order)
        albums = albums.order_by("-release_date" if sort != "listeners" else "-release_date")
        return Response({
            "albums": AlbumSerializer(albums, many=True).data,
            "singles": TrackSerializer(singles, many=True).data,
        })
