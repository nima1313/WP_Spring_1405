"""
Aggregation logic (§3.7). Everything here is computed backend-side; the frontend
only ever receives the aggregated figures, never the raw rows they came from.
"""

from django.conf import settings
from django.db.models import Count
from django.utils import timezone

from accounts.models import Artist, User
from billing.services import price_for
from core.tiers import TIER_ORDER

from .models import ArtistMonthlyAccount


def current_month() -> str:
    return timezone.localtime().strftime("%Y-%m")


def compute_reward(streams: int, unique_listeners: int) -> int:
    return (streams * settings.REWARD_PER_STREAM
            + unique_listeners * settings.REWARD_PER_LISTENER)


def ensure_current_month_rows():
    """
    Make sure every approved artist has a row for the current month. Existing
    rows are left untouched (settled rows must never change; seeded/pending rows
    keep their figures), so this is safe to call on every read.
    """
    from engagement.models import StreamEvent

    month = current_month()
    start = timezone.localtime().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    existing = set(
        ArtistMonthlyAccount.objects.filter(month=month).values_list("artist_id", flat=True)
    )
    for artist in Artist.objects.filter(status="approved"):
        if artist.id in existing:
            continue
        events = StreamEvent.objects.filter(track__artist=artist, at__gte=start)
        streams = events.count()
        unique_listeners = events.values("user").distinct().count()
        ArtistMonthlyAccount.objects.create(
            artist=artist, month=month, streams=streams,
            unique_listeners=unique_listeners,
            reward=compute_reward(streams, unique_listeners), status="pending",
        )


def user_distribution():
    """Listener counts per tier — a pure aggregate, never a raw user list."""
    counts = dict(
        User.objects.filter(role="listener")
        .values_list("tier")
        .annotate(n=Count("id"))
    )
    return [{"tier": tier, "count": counts.get(tier, 0)} for tier in TIER_ORDER]


def monthly_revenue() -> int:
    """Monthly recurring revenue = Σ (listeners on a paid tier × that tier's price)."""
    counts = dict(
        User.objects.filter(role="listener")
        .values_list("tier")
        .annotate(n=Count("id"))
    )
    return (counts.get("silver", 0) * price_for("silver")
            + counts.get("gold", 0) * price_for("gold"))
