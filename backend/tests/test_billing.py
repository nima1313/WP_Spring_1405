"""Billing: runtime pricing, mock purchase → verify → tier grant & renewal."""

import pytest
from django.utils import timezone

from billing.models import Payment, SubscriptionPlan

pytestmark = pytest.mark.django_db

PASSWORD = "nava1234"


def _login(api, user):
    api.post("/api/auth/login", {"email": user.email, "password": PASSWORD})


@pytest.fixture
def plans():
    SubscriptionPlan.objects.create(tier="silver", monthly_price=79000)
    SubscriptionPlan.objects.create(tier="gold", monthly_price=149000)


def test_prices_endpoint_returns_both_tiers(api, plans, basic_user):
    _login(api, basic_user)
    res = api.get("/api/plans")
    assert res.status_code == 200
    assert res.data["silver"] == 79000
    assert res.data["gold"] == 149000


def test_admin_price_patch_applies_instantly(api, plans, admin_user):
    _login(api, admin_user)
    res = api.patch("/api/plans", {"gold": 199000})
    assert res.status_code == 200
    assert res.data["gold"] == 199000
    assert SubscriptionPlan.objects.get(tier="gold").monthly_price == 199000


def test_non_admin_cannot_change_prices(api, plans, silver_user):
    _login(api, silver_user)
    assert api.patch("/api/plans", {"gold": 1}).status_code == 403


def test_purchase_amount_is_months_times_price(api, plans, basic_user):
    _login(api, basic_user)
    res = api.post("/api/payments", {"tier": "gold", "months": 3})
    assert res.status_code == 201
    payment = Payment.objects.get(id=res.data["payment_id"])
    assert payment.amount == 149000 * 3
    assert payment.status == "pending"


def test_mock_verify_grants_tier_and_extends_expiry(api, plans, basic_user):
    _login(api, basic_user)
    res = api.post("/api/payments", {"tier": "gold", "months": 3})
    payment = Payment.objects.get(id=res.data["payment_id"])
    # Hit the callback the way the mock bank page would, with a success Status.
    cb = api.get(
        f"/api/payments/callback?payment={payment.id}"
        f"&Status=OK&Authority={payment.authority}"
    )
    assert cb.status_code == 302 and "payment=success" in cb["Location"]
    basic_user.refresh_from_db()
    assert basic_user.tier == "gold"
    assert basic_user.is_subscription_active
    # ~3 months out
    delta = basic_user.subscription_expires_at - timezone.now()
    assert 85 <= delta.days <= 92


def test_failed_verify_leaves_tier_unchanged(api, plans, basic_user):
    _login(api, basic_user)
    res = api.post("/api/payments", {"tier": "gold", "months": 1})
    payment = Payment.objects.get(id=res.data["payment_id"])
    cb = api.get(
        f"/api/payments/callback?payment={payment.id}"
        f"&Status=NOK&Authority={payment.authority}"
    )
    assert cb.status_code == 302 and "payment=failed" in cb["Location"]
    basic_user.refresh_from_db()
    assert basic_user.tier == "basic"
    assert Payment.objects.get(id=payment.id).status == "failed"


def test_artist_cannot_purchase(api, plans, artist_user):
    _login(api, artist_user)
    assert api.post("/api/payments", {"tier": "gold", "months": 1}).status_code == 403
