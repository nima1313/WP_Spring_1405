"""Auth + registration: login, the /me session source of truth, sign-ups."""

import pytest

from accounts.models import Artist, User, Verification
from engagement.models import Notification

pytestmark = pytest.mark.django_db

PASSWORD = "nava1234"


def test_login_ok_returns_user(api, basic_user):
    res = api.post(
        "/api/auth/login", {"email": basic_user.email, "password": PASSWORD}
    )
    assert res.status_code == 200
    assert res.data["email"] == basic_user.email
    # camelCase renderer turns effective_tier → tier on the wire.
    assert res.data["tier"] == "basic"


def test_login_bad_password_rejected(api, basic_user):
    res = api.post(
        "/api/auth/login", {"email": basic_user.email, "password": "wrong"}
    )
    assert res.status_code == 400


def test_me_anonymous_is_401_and_plants_csrf_cookie(api):
    res = api.get("/api/me")
    assert res.status_code == 401
    assert "csrf_token" in res.cookies


def test_me_after_login(api, basic_user):
    api.post("/api/auth/login", {"email": basic_user.email, "password": PASSWORD})
    res = api.get("/api/me")
    assert res.status_code == 200
    assert res.data["id"] == basic_user.id


def test_register_listener_creates_basic_user_and_logs_in(api):
    res = api.post(
        "/api/auth/register/listener",
        {"email": "new@t.app", "password": PASSWORD, "displayName": "New"},
    )
    assert res.status_code == 201
    user = User.objects.get(email="new@t.app")
    assert user.role == "listener" and user.tier == "basic"
    assert user.handle.startswith("@nava_")
    # logged in immediately
    assert api.get("/api/me").status_code == 200


def test_register_artist_creates_pending_artist_and_notifies_staff(api, support_user):
    res = api.post(
        "/api/auth/register/artist",
        {
            "email": "star@t.app",
            "password": PASSWORD,
            "artistName": "Star",
            "sampleWorks": "https://example.com/star",
        },
    )
    assert res.status_code == 201
    artist = Artist.objects.get(email="star@t.app")
    assert artist.status == "pending" and artist.verified is False
    assert Verification.objects.filter(artist=artist, status="pending").exists()
    # staff got a verification_request notification
    assert Notification.objects.filter(
        user=support_user, kind="verification_request"
    ).exists()
    # artist registration does NOT log the user in (awaits approval)
    assert api.get("/api/me").status_code == 401


def test_logout_clears_session(api, basic_user):
    api.post("/api/auth/login", {"email": basic_user.email, "password": PASSWORD})
    assert api.post("/api/auth/logout").status_code == 204
    assert api.get("/api/me").status_code == 401
