"""
Shared pytest fixtures and lightweight factories for the Nava backend tests.

Every fixture builds only what a test needs (no full seed), so the suite stays
fast and each case is isolated. Auth is exercised through the real DRF client
with SessionAuthentication, which also covers the CSRF-exempt test path.
"""

import io

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Artist, User
from catalog.models import Album, Track

PASSWORD = "nava1234"


@pytest.fixture
def api():
    return APIClient()


def _make_user(email, role="listener", tier="basic", handle=None, **extra):
    handle = handle or f"@nava_{email.split('@')[0]}"
    active_months = extra.pop("active_months", None)
    user = User.objects.create_user(
        email=email,
        password=PASSWORD,
        handle=handle,
        display_name=email.split("@")[0],
        role=role,
        tier=tier,
        **extra,
    )
    # Paid listeners need a live subscription window or effective_tier drops to basic.
    if role == "listener" and tier != "basic":
        user.subscription_expires_at = timezone.now() + timezone.timedelta(
            days=30 * (active_months or 1)
        )
        user.save(update_fields=["subscription_expires_at"])
    return user


@pytest.fixture
def make_user():
    return _make_user


@pytest.fixture
def basic_user():
    return _make_user("basic@t.app", tier="basic")


@pytest.fixture
def silver_user():
    return _make_user("silver@t.app", tier="silver")


@pytest.fixture
def gold_user():
    return _make_user("gold@t.app", tier="gold")


@pytest.fixture
def admin_user():
    return _make_user("admin@t.app", role="admin", tier="gold")


@pytest.fixture
def support_user():
    return _make_user("support@t.app", role="support", tier="gold")


@pytest.fixture
def artist_profile():
    return Artist.objects.create(
        name="Navid", pro_id="PRO-NAVID", email="navid@t.app",
        status="approved", verified=True,
    )


@pytest.fixture
def artist_user(artist_profile):
    return _make_user(
        "artist@t.app", role="artist", tier="gold", artist=artist_profile
    )


def _make_track(artist, title="Song", **extra):
    return Track.objects.create(artist=artist, title=title, **extra)


@pytest.fixture
def make_track():
    return _make_track


@pytest.fixture
def make_album():
    def _factory(artist, title="Album", **extra):
        return Album.objects.create(artist=artist, title=title, **extra)

    return _factory


@pytest.fixture
def png_bytes():
    """Minimal 1x1 PNG for avatar/cover upload tests (no Pillow decode needed)."""
    return (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
        b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )


@pytest.fixture
def upload_file():
    from django.core.files.uploadedfile import SimpleUploadedFile

    def _factory(name, content, content_type="application/octet-stream"):
        if isinstance(content, str):
            content = content.encode()
        return SimpleUploadedFile(name, content, content_type=content_type)

    return _factory
