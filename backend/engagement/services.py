"""Engagement domain logic: notifications and stream recording."""

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from catalog.models import Track
from core.exceptions import StreamLimitExceeded
from core.tiers import can_stream

from .models import Notification, RecentItem, StreamEvent


def notify(user, kind, title, body, href=""):
    """The single place notifications are created (never from the client)."""
    return Notification.objects.create(
        user=user, kind=kind, title=title, body=body, href=href
    )


def today_stream_count(user) -> int:
    start = timezone.localtime().replace(hour=0, minute=0, second=0, microsecond=0)
    return StreamEvent.objects.filter(user=user, at__gte=start).count()


def add_recent(user, kind, ref_id):
    RecentItem.objects.filter(user=user, kind=kind, ref_id=ref_id).delete()
    RecentItem.objects.create(user=user, kind=kind, ref_id=ref_id, at=timezone.now())
    # keep only the 50 most recent
    stale = RecentItem.objects.filter(user=user).order_by("-at")[50:].values_list("pk", flat=True)
    if stale:
        RecentItem.objects.filter(pk__in=list(stale)).delete()


@transaction.atomic
def record_stream(user, track_id) -> int:
    """
    Records a play. Enforces the basic-tier 60/day cap (raises
    StreamLimitExceeded → HTTP 429), bumps the track counters, adds a recent.
    Returns the new today-count.
    """
    used_today = today_stream_count(user)
    if not can_stream(user.effective_tier, used_today):
        raise StreamLimitExceeded()

    track = Track.objects.filter(id=track_id).first()
    if track is None:
        from rest_framework.exceptions import NotFound

        raise NotFound("اثر یافت نشد.")

    first_time = not StreamEvent.objects.filter(user=user, track=track).exists()
    StreamEvent.objects.create(user=user, track=track)
    Track.objects.filter(pk=track.pk).update(
        streams=F("streams") + 1,
        listeners=F("listeners") + (1 if first_time else 0),
    )
    add_recent(user, "track", track_id)
    return used_today + 1
