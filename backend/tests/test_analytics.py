"""Analytics + verification review + the recommendation engine (bonus)."""

import pytest

from accounts.models import Verification
from analytics.recommendations import recommend_for
from billing.models import SubscriptionPlan
from engagement.models import Notification, StreamEvent

pytestmark = pytest.mark.django_db

PASSWORD = "nava1234"


def _login(api, user):
    api.post("/api/auth/login", {"email": user.email, "password": PASSWORD})


def test_user_distribution_is_an_aggregate(
    api, admin_user, make_user
):
    make_user("b1@t.app", tier="basic")
    make_user("s1@t.app", tier="silver")
    make_user("g1@t.app", tier="gold")
    _login(api, admin_user)
    res = api.get("/api/stats/user-distribution")
    assert res.status_code == 200
    counts = {row["tier"]: row["count"] for row in res.data}
    assert counts["basic"] == 1 and counts["silver"] == 1 and counts["gold"] == 1


def test_monthly_revenue_sums_paid_tiers(api, admin_user, make_user):
    SubscriptionPlan.objects.create(tier="silver", monthly_price=79000)
    SubscriptionPlan.objects.create(tier="gold", monthly_price=149000)
    make_user("s@t.app", tier="silver")
    make_user("g@t.app", tier="gold")
    _login(api, admin_user)
    res = api.get("/api/stats/monthly-revenue")
    assert res.data["revenue"] == 79000 + 149000


def test_distribution_forbidden_for_non_admin(api, silver_user):
    _login(api, silver_user)
    assert api.get("/api/stats/user-distribution").status_code == 403


def test_accounting_recompute_and_settle_notifies(
    api, admin_user, artist_user, artist_profile, make_track, basic_user
):
    track = make_track(artist_profile, source_url="/x.mp3")
    StreamEvent.objects.create(user=basic_user, track=track)
    _login(api, admin_user)
    rows = api.get("/api/accounting").data
    assert len(rows) >= 1
    row = next(r for r in rows if r["artist_id"] == artist_profile.id)
    assert row["streams"] >= 1

    res = api.post(f"/api/accounting/{row['id']}/settle")
    assert res.status_code == 200
    assert res.data["status"] == "settled"
    assert Notification.objects.filter(
        user=artist_user, kind="monthly_finance"
    ).exists()


def test_verification_approve_syncs_artist_and_notifies(
    api, support_user, artist_user, artist_profile
):
    # Start the artist as pending/unverified so approval has an effect.
    artist_profile.status = "pending"
    artist_profile.verified = False
    artist_profile.save()
    verification = Verification.objects.create(artist=artist_profile, status="pending")

    _login(api, support_user)
    res = api.patch(f"/api/verifications/{verification.id}", {"status": "approved"})
    assert res.status_code == 200

    artist_profile.refresh_from_db()
    assert artist_profile.verified is True and artist_profile.status == "approved"
    assert Notification.objects.filter(
        user=artist_user, kind="verification_result"
    ).exists()


def test_recommender_excludes_heard_and_early_access(
    basic_user, artist_profile, make_track
):
    heard = make_track(artist_profile, title="Heard", genre="pop")
    fresh = make_track(artist_profile, title="Fresh", genre="pop")
    early = make_track(artist_profile, title="Early", genre="pop", early_access=True)
    StreamEvent.objects.create(user=basic_user, track=heard)

    recs = recommend_for(basic_user)
    ids = {t.id for t in recs}
    assert fresh.id in ids           # same genre/artist as the heard track
    assert heard.id not in ids       # already heard → excluded
    assert early.id not in ids       # early-access hidden from non-gold


def test_recommender_is_deterministic(basic_user, artist_profile, make_track):
    a = make_track(artist_profile, title="A", genre="pop", streams=10)
    b = make_track(artist_profile, title="B", genre="pop", streams=20)
    StreamEvent.objects.create(
        user=basic_user, track=make_track(artist_profile, title="seed", genre="pop")
    )
    first = [t.id for t in recommend_for(basic_user)]
    second = [t.id for t in recommend_for(basic_user)]
    assert first == second  # stable ordering, not random
