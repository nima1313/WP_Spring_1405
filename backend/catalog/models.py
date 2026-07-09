from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils import timezone

from accounts.models import Artist
from core.models import short_id

RELEASE_TYPE_CHOICES = [("single", "single"), ("album", "album")]
AUDIO_EXTENSIONS = ["mp3", "wav", "flac"]


class Album(models.Model):
    id = models.CharField(primary_key=True, max_length=40, default=short_id("al"))
    title = models.CharField(max_length=200)
    artist = models.ForeignKey(
        Artist, on_delete=models.CASCADE, related_name="albums"
    )
    cover = models.ImageField(upload_to="covers/", null=True, blank=True)
    cover_url = models.CharField(max_length=500, blank=True, default="")
    release_date = models.DateTimeField(default=timezone.now)
    genre = models.CharField(max_length=80, blank=True, default="")

    class Meta:
        ordering = ["-release_date"]

    def __str__(self):
        return self.title

    @property
    def cover_display(self) -> str:
        return self.cover.url if self.cover else self.cover_url


class Track(models.Model):
    id = models.CharField(primary_key=True, max_length=40, default=short_id("tr"))
    title = models.CharField(max_length=200)
    artist = models.ForeignKey(
        Artist, on_delete=models.CASCADE, related_name="tracks"
    )
    featured_artists = models.ManyToManyField(
        Artist, blank=True, related_name="featured_on"
    )
    album = models.ForeignKey(
        Album, null=True, blank=True, on_delete=models.SET_NULL, related_name="tracks"
    )
    # Real uploaded file (§3.4) with a URL fallback for the bundled demo audio.
    audio = models.FileField(
        upload_to="tracks/",
        null=True,
        blank=True,
        validators=[FileExtensionValidator(AUDIO_EXTENSIONS)],
    )
    source_url = models.CharField(max_length=500, blank=True, default="")
    cover = models.ImageField(upload_to="covers/", null=True, blank=True)
    cover_url = models.CharField(max_length=500, blank=True, default="")
    duration = models.PositiveIntegerField(default=0)
    lyrics = models.TextField(blank=True, default="")
    genre = models.CharField(max_length=80, blank=True, default="")
    release_date = models.DateTimeField(default=timezone.now)
    type = models.CharField(max_length=8, choices=RELEASE_TYPE_CHOICES, default="single")
    listeners = models.PositiveIntegerField(default=0)
    streams = models.PositiveIntegerField(default=0)
    early_access = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-release_date"]

    def __str__(self):
        return self.title

    @property
    def audio_url(self) -> str:
        return self.audio.url if self.audio else self.source_url

    @property
    def cover_display(self) -> str:
        return self.cover.url if self.cover else self.cover_url
