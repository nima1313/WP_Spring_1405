from rest_framework import serializers

from .models import ArtistMonthlyAccount


class AccountingRowSerializer(serializers.ModelSerializer):
    artist_id = serializers.CharField(read_only=True)
    artist_name = serializers.CharField(source="artist.name", read_only=True)
    artist_pro_id = serializers.CharField(source="artist.pro_id", read_only=True)

    class Meta:
        model = ArtistMonthlyAccount
        fields = [
            "id", "artist_id", "artist_name", "artist_pro_id", "month",
            "unique_listeners", "streams", "reward", "status",
        ]
