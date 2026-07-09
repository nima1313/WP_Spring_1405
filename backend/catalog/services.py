"""Catalog domain logic kept out of the views (thin-view convention)."""

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from .models import Album, Track


def probe_duration(uploaded_file) -> int:
    """Best-effort audio length in seconds via mutagen; 0 if unreadable."""
    if not uploaded_file:
        return 0
    try:
        import mutagen

        uploaded_file.seek(0)
        meta = mutagen.File(uploaded_file)
        uploaded_file.seek(0)
        if meta and meta.info and getattr(meta.info, "length", None):
            return int(meta.info.length)
    except Exception:
        pass
    return 0


def visible_tracks(user):
    """
    Early-access filter (§4.2/§9.2): early-access releases are reserved for gold
    tiers; everyone else sees them only if they own the artist profile.
    """
    qs = Track.objects.all()
    if user.effective_tier == "gold" or user.role in ("support", "admin"):
        return qs
    return qs.filter(Q(early_access=False) | Q(artist__user=user))


@transaction.atomic
def publish_work(*, artist, title, release_type, genre, lyrics, featured_ids,
                 audio_file, cover_file, source_url=""):
    duration = probe_duration(audio_file)
    track = Track.objects.create(
        title=title,
        artist=artist,
        album=None,
        audio=audio_file,
        source_url=source_url,
        cover=cover_file,
        duration=duration or 200,
        lyrics=lyrics or "",
        genre=genre,
        release_date=timezone.now(),
        type=release_type,
        early_access=True,
    )
    if featured_ids:
        track.featured_artists.set(
            [a for a in artist.__class__.objects.filter(id__in=featured_ids)]
        )
    if release_type == "album":
        album = Album.objects.create(
            title=title, artist=artist, cover=cover_file, genre=genre,
            release_date=track.release_date,
        )
        track.album = album
        track.position = 0
        track.save(update_fields=["album", "position"])
    return track
