from django.db import models

from accounts.models import Artist
from core.models import short_id

ACCOUNT_STATUS = [("pending", "pending"), ("settled", "settled")]


class ArtistMonthlyAccount(models.Model):
    """Monthly accounting row per artist (§2.11.2). One per (artist, month)."""

    id = models.CharField(primary_key=True, max_length=40, default=short_id("ac"))
    artist = models.ForeignKey(
        Artist, on_delete=models.CASCADE, related_name="accounts"
    )
    month = models.CharField(max_length=7)  # YYYY-MM
    unique_listeners = models.PositiveIntegerField(default=0)
    streams = models.PositiveIntegerField(default=0)
    reward = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=16, choices=ACCOUNT_STATUS, default="pending")

    class Meta:
        unique_together = ("artist", "month")
        ordering = ["-month"]
