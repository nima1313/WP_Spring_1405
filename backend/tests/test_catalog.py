"""Catalog: early-access gating, multipart publish, tier-gated download."""

import pytest

from accounts.models import Artist
from catalog.models import Album, Track

pytestmark = pytest.mark.django_db

PASSWORD = "nava1234"


def _login(api, user):
    api.post("/api/auth/login", {"email": user.email, "password": PASSWORD})


def test_early_access_hidden_from_basic(api, basic_user, artist_profile, make_track):
    make_track(artist_profile, title="Public", early_access=False)
    make_track(artist_profile, title="Exclusive", early_access=True)
    _login(api, basic_user)
    res = api.get("/api/tracks")
    titles = {t["title"] for t in res.data}
    assert titles == {"Public"}


def test_early_access_visible_to_gold(api, gold_user, artist_profile, make_track):
    make_track(artist_profile, title="Public", early_access=False)
    make_track(artist_profile, title="Exclusive", early_access=True)
    _login(api, gold_user)
    res = api.get("/api/tracks")
    titles = {t["title"] for t in res.data}
    assert titles == {"Public", "Exclusive"}


def test_early_access_visible_to_owning_artist(
    api, artist_user, artist_profile, make_track
):
    make_track(artist_profile, title="Exclusive", early_access=True)
    _login(api, artist_user)
    res = api.get("/api/tracks")
    assert {t["title"] for t in res.data} == {"Exclusive"}


def test_publish_multipart_saves_file_and_creates_album(
    api, artist_user, upload_file
):
    _login(api, artist_user)
    audio = upload_file("song.mp3", b"ID3fakeaudio", "audio/mpeg")
    res = api.post(
        "/api/tracks",
        {"title": "My Album", "type": "album", "genre": "pop", "audio": audio},
        format="multipart",
    )
    assert res.status_code == 201
    track = Track.objects.get(id=res.data["id"])
    assert track.audio  # a file was stored
    assert track.type == "album"
    assert Album.objects.filter(artist=artist_user.artist).exists()


def test_listener_cannot_publish(api, gold_user, upload_file):
    _login(api, gold_user)
    audio = upload_file("song.mp3", b"x", "audio/mpeg")
    res = api.post("/api/tracks", {"title": "Nope", "audio": audio}, format="multipart")
    assert res.status_code == 403


def test_unverified_artist_cannot_publish(api, make_user, upload_file):
    pending = Artist.objects.create(
        name="Pend", pro_id="PRO-PEND", email="p@t.app",
        status="pending", verified=False,
    )
    user = make_user("pend@t.app", role="artist", tier="gold", artist=pending)
    _login(api, user)
    res = api.post("/api/tracks", {"title": "X"}, format="multipart")
    assert res.status_code == 403


def test_download_denied_for_basic(api, basic_user, artist_profile, make_track):
    track = make_track(artist_profile, source_url="/audio/song-1.mp3")
    _login(api, basic_user)
    res = api.get(f"/api/tracks/{track.id}/download")
    assert res.status_code == 403


def test_download_allowed_for_silver(api, silver_user, artist_profile, make_track):
    track = make_track(artist_profile, source_url="/audio/song-1.mp3")
    _login(api, silver_user)
    res = api.get(f"/api/tracks/{track.id}/download")
    # source_url fallback → redirect to the bundled file
    assert res.status_code in (302, 200)


def test_track_delete_by_non_owner_forbidden(
    api, artist_profile, make_track, make_user
):
    track = make_track(artist_profile)
    other_artist = Artist.objects.create(
        name="Other", pro_id="PRO-OTHER", email="o@t.app",
        status="approved", verified=True,
    )
    intruder = make_user("intruder@t.app", role="artist", tier="gold", artist=other_artist)
    _login(api, intruder)
    assert api.delete(f"/api/tracks/{track.id}").status_code == 403
