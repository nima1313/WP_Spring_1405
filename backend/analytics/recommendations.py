"""
Song recommender (bonus فعالیت امتیازی §5.2).

Deterministic and explainable — not random. It scores candidate tracks by how
well they match the listener's recent taste, derived from their last-30-days
plays plus the artists they follow:

  score = 3·(followed artist) + 2·(genre they play a lot)
        + 1·(artist they play a lot) + small popularity tiebreak

Already-heard tracks are excluded, and early-access tracks are hidden from
non-gold listeners (same rule as the catalog). Top 10 are returned.
"""

from collections import Counter

from django.utils import timezone

from catalog.services import visible_tracks


def recommend_for(user, limit: int = 10):
    from engagement.models import StreamEvent

    since = timezone.now() - timezone.timedelta(days=30)
    recent = (
        StreamEvent.objects.filter(user=user, at__gte=since)
        .select_related("track")
    )

    genre_weight = Counter()
    artist_weight = Counter()
    heard_ids = set()
    for event in recent:
        track = event.track
        heard_ids.add(track.id)
        if track.genre:
            genre_weight[track.genre] += 1
        artist_weight[track.artist_id] += 1

    followed = set(user.following_artists.values_list("artist_id", flat=True))

    candidates = visible_tracks(user).exclude(id__in=heard_ids)
    scored = []
    for track in candidates:
        score = 0.0
        if track.artist_id in followed:
            score += 3
        score += 2 * genre_weight.get(track.genre, 0)
        score += 1 * artist_weight.get(track.artist_id, 0)
        score += min(track.streams, 100000) / 1_000_000  # tiny popularity nudge
        if score > 0:
            scored.append((score, track))

    # New listeners with no history: fall back to the most-streamed tracks.
    if not scored:
        popular = candidates.order_by("-streams")[:limit]
        return list(popular)

    scored.sort(key=lambda pair: (pair[0], pair[1].streams), reverse=True)
    return [track for _, track in scored[:limit]]
