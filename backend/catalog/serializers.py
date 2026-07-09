from rest_framework import serializers

from .models import Album, Track


class TrackSerializer(serializers.ModelSerializer):
    """Mirrors the `Track` interface in lib/types.ts."""

    artist_id = serializers.CharField(read_only=True)
    album_id = serializers.CharField(read_only=True)
    featured_artist_ids = serializers.SerializerMethodField()
    audio_url = serializers.CharField(read_only=True)
    cover_url = serializers.CharField(source="cover_display", read_only=True)

    class Meta:
        model = Track
        fields = [
            "id", "title", "artist_id", "featured_artist_ids", "album_id",
            "cover_url", "audio_url", "duration", "lyrics", "genre",
            "release_date", "type", "listeners", "streams", "early_access",
        ]

    def get_featured_artist_ids(self, obj):
        return list(obj.featured_artists.values_list("id", flat=True))


class AlbumSerializer(serializers.ModelSerializer):
    artist_id = serializers.CharField(read_only=True)
    cover_url = serializers.CharField(source="cover_display", read_only=True)
    track_ids = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = [
            "id", "title", "artist_id", "cover_url", "release_date",
            "genre", "track_ids",
        ]

    def get_track_ids(self, obj):
        return list(
            obj.tracks.order_by("position", "release_date", "id").values_list(
                "id", flat=True
            )
        )
