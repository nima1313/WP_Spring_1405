from django.db import models
from django.utils import timezone

from accounts.models import User
from catalog.models import Track
from core.models import short_id

NOTIFICATION_KINDS = [
    ("subscription_expiry", "subscription_expiry"),
    ("new_follower", "new_follower"),
    ("new_release", "new_release"),
    ("verification_result", "verification_result"),
    ("monthly_finance", "monthly_finance"),
    ("new_ticket", "new_ticket"),
    ("verification_request", "verification_request"),
]
RECENT_KINDS = [("track", "track"), ("playlist", "playlist")]


class Playlist(models.Model):
    id = models.CharField(primary_key=True, max_length=40, default=short_id("pl"))
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="playlists"
    )
    cover = models.ImageField(upload_to="covers/", null=True, blank=True)
    cover_url = models.CharField(max_length=500, blank=True, default="")
    tracks = models.ManyToManyField(Track, through="PlaylistTrack", related_name="playlists")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    @property
    def cover_display(self) -> str:
        return self.cover.url if self.cover else self.cover_url


class PlaylistTrack(models.Model):
    """Ordered membership — preserves the phase-1 `trackIds` array order."""

    playlist = models.ForeignKey(
        Playlist, on_delete=models.CASCADE, related_name="items"
    )
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("playlist", "track")
        ordering = ["position"]


class StreamEvent(models.Model):
    """One play, used to enforce the basic-tier 60/day cap (§9.2)."""

    id = models.CharField(primary_key=True, max_length=40, default=short_id("st"))
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="streams")
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name="stream_events")
    at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [models.Index(fields=["user", "at"])]


class RecentItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="recents")
    kind = models.CharField(max_length=8, choices=RECENT_KINDS)
    ref_id = models.CharField(max_length=40)
    at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("user", "kind", "ref_id")
        ordering = ["-at"]


class Notification(models.Model):
    id = models.CharField(primary_key=True, max_length=40, default=short_id("nt"))
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    kind = models.CharField(max_length=32, choices=NOTIFICATION_KINDS)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True, default="")
    read = models.BooleanField(default=False)
    href = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]
