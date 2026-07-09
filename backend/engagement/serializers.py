from rest_framework import serializers

from .models import Notification, Playlist, RecentItem


class PlaylistSerializer(serializers.ModelSerializer):
    owner_id = serializers.CharField(read_only=True)
    cover_url = serializers.CharField(source="cover_display", read_only=True)
    track_ids = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = [
            "id", "name", "owner_id", "track_ids", "cover_url",
            "created_at", "updated_at",
        ]

    def get_track_ids(self, obj):
        return list(obj.items.order_by("position").values_list("track_id", flat=True))


class NotificationSerializer(serializers.ModelSerializer):
    user_id = serializers.CharField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id", "user_id", "kind", "title", "body", "read", "created_at", "href",
        ]


class RecentItemSerializer(serializers.ModelSerializer):
    user_id = serializers.CharField(read_only=True)

    class Meta:
        model = RecentItem
        fields = ["user_id", "kind", "ref_id", "at"]
