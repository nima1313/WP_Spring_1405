"""
Server-side mirror of lib/subscriptions.ts (Table 1 of the spec).

This is the single source of truth for every tier gate on the backend. The
frontend keeps its own copy for optimistic UI, but the browser is not trusted:
every limit here is re-checked before a write succeeds.
"""

from dataclasses import dataclass

UNLIMITED = -1


@dataclass(frozen=True)
class TierConfig:
    streams_per_day: int
    max_playlists: int
    can_upload_avatar: bool
    can_download: bool
    early_access: bool
    can_view_stats: bool


TIERS = {
    "basic": TierConfig(
        streams_per_day=60,
        max_playlists=6,
        can_upload_avatar=False,
        can_download=False,
        early_access=False,
        can_view_stats=False,
    ),
    "silver": TierConfig(
        streams_per_day=UNLIMITED,
        max_playlists=100,
        can_upload_avatar=True,
        can_download=True,
        early_access=False,
        can_view_stats=False,
    ),
    "gold": TierConfig(
        streams_per_day=UNLIMITED,
        max_playlists=UNLIMITED,
        can_upload_avatar=True,
        can_download=True,
        early_access=True,
        can_view_stats=True,
    ),
}

TIER_ORDER = ["basic", "silver", "gold"]


def config_for(tier: str) -> TierConfig:
    return TIERS.get(tier, TIERS["basic"])


def is_unlimited(value: int) -> bool:
    return value == UNLIMITED


def can_stream(tier: str, used_today: int) -> bool:
    limit = config_for(tier).streams_per_day
    return is_unlimited(limit) or used_today < limit


def can_create_playlist(tier: str, current_count: int) -> bool:
    limit = config_for(tier).max_playlists
    return is_unlimited(limit) or current_count < limit
