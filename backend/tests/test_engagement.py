"""Engagement: stream cap, unique-listener counting, playlist tier cap, users list."""

import pytest

from engagement.models import Playlist, StreamEvent
from engagement.services import record_stream

pytestmark = pytest.mark.django_db

PASSWORD = "nava1234"


def _login(api, user):
    api.post("/api/auth/login", {"email": user.email, "password": PASSWORD})


def _stream(api, track_id):
    return api.post("/api/streams", {"trackId": track_id})


def test_basic_hits_60_stream_cap(api, basic_user, artist_profile, make_track):
    track = make_track(artist_profile, source_url="/audio/x.mp3")
    # Pre-fill 60 plays directly, then the 61st via the API must 429.
    for _ in range(60):
        StreamEvent.objects.create(user=basic_user, track=track)
    _login(api, basic_user)
    res = _stream(api, track.id)
    assert res.status_code == 429
    assert res.data.get("code") == "stream_limit"


def test_silver_streams_unlimited(api, silver_user, artist_profile, make_track):
    track = make_track(artist_profile, source_url="/audio/x.mp3")
    for _ in range(60):
        StreamEvent.objects.create(user=silver_user, track=track)
    _login(api, silver_user)
    assert _stream(api, track.id).status_code == 201


def test_unique_listener_counted_once(basic_user, artist_profile, make_track):
    track = make_track(artist_profile, source_url="/audio/x.mp3")
    record_stream(basic_user, track.id)
    record_stream(basic_user, track.id)
    track.refresh_from_db()
    assert track.streams == 2
    assert track.listeners == 1  # same listener, counted once


def test_seventh_basic_playlist_forbidden(api, basic_user):
    for i in range(6):
        Playlist.objects.create(name=f"P{i}", owner=basic_user)
    _login(api, basic_user)
    res = api.post("/api/playlists", {"name": "seventh"})
    assert res.status_code == 403
    assert res.data.get("code") == "playlist_limit"


def test_gold_playlist_unlimited(api, gold_user):
    for i in range(6):
        Playlist.objects.create(name=f"P{i}", owner=gold_user)
    _login(api, gold_user)
    assert api.post("/api/playlists", {"name": "seventh"}).status_code == 201


def test_foreign_playlist_rename_forbidden(api, basic_user, make_user):
    other = make_user("other@t.app")
    playlist = Playlist.objects.create(name="Theirs", owner=other)
    _login(api, basic_user)
    res = api.patch(f"/api/playlists/{playlist.id}", {"name": "hijacked"})
    assert res.status_code in (403, 404)


def test_users_list_is_staff_only(api, basic_user):
    _login(api, basic_user)
    assert api.get("/api/users").status_code == 403


def test_users_list_allowed_for_admin(api, admin_user):
    _login(api, admin_user)
    assert api.get("/api/users").status_code == 200
