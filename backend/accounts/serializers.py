import secrets

from django.utils import timezone
from rest_framework import serializers

from .models import Artist, User, Verification


def make_handle() -> str:
    return f"@nava_{secrets.token_hex(2)}"


def make_pro_id() -> str:
    return f"ART-{secrets.randbelow(9000) + 1000}"


class UserSerializer(serializers.ModelSerializer):
    """Mirrors the `User` interface in lib/types.ts (camelCased by the renderer)."""

    tier = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    following_user_ids = serializers.SerializerMethodField()
    following_artist_ids = serializers.SerializerMethodField()
    artist_id = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "handle", "display_name", "email", "role", "tier",
            "subscription_expires_at", "avatar_url", "birthday", "gender",
            "bio", "following_user_ids", "following_artist_ids",
            "follower_count", "artist_id", "created_at",
        ]

    def get_tier(self, obj) -> str:
        return obj.effective_tier

    def get_avatar_url(self, obj) -> str:
        return obj.avatar.url if obj.avatar else ""

    def get_following_user_ids(self, obj):
        return list(obj.following_users.values_list("target_id", flat=True))

    def get_following_artist_ids(self, obj):
        return list(obj.following_artists.values_list("artist_id", flat=True))


class UserUpdateSerializer(serializers.ModelSerializer):
    """PATCH /users/{id}. tier/subscription are payment-owned (admin may override)."""

    class Meta:
        model = User
        fields = ["display_name", "bio", "birthday", "gender", "tier",
                  "subscription_expires_at"]
        extra_kwargs = {f: {"required": False} for f in fields}

    def validate(self, attrs):
        request = self.context["request"]
        if request.user.role != "admin":
            attrs.pop("tier", None)
            attrs.pop("subscription_expires_at", None)
        return attrs


class ArtistSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()

    class Meta:
        model = Artist
        fields = [
            "id", "name", "pro_id", "bio", "avatar_url", "verified", "status",
            "rejection_reason", "sample_works", "email", "user_id",
            "follower_count", "monthly_listeners", "created_at",
        ]

    def get_avatar_url(self, obj) -> str:
        return obj.avatar.url if obj.avatar else ""

    def get_user_id(self, obj):
        user = getattr(obj, "user", None)
        return user.id if user else None


class ArtistUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ["name", "bio"]
        extra_kwargs = {"name": {"required": False}, "bio": {"required": False}}


class VerificationSerializer(serializers.ModelSerializer):
    """Mirrors `Verification` — artist fields are flattened from the FK."""

    artist_name = serializers.CharField(source="artist.name", read_only=True)
    email = serializers.EmailField(source="artist.email", read_only=True)
    sample_works = serializers.CharField(source="artist.sample_works", read_only=True)

    class Meta:
        model = Verification
        fields = [
            "id", "artist_id", "artist_name", "email", "sample_works",
            "status", "reason", "created_at",
        ]


# ---- Auth input serializers ------------------------------------------------


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class RegisterListenerSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6)
    birthday = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(
        choices=["male", "female", "other"], required=False, allow_null=True
    )

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("این ایمیل قبلاً ثبت شده است.")
        return value

    def create(self, validated):
        user = User.objects.create_user(
            email=validated["email"],
            password=validated["password"],
            handle=make_handle(),
            display_name=validated["display_name"],
            role="listener",
            tier="basic",
            birthday=validated.get("birthday"),
            gender=validated.get("gender"),
            subscription_expires_at=timezone.now() + timezone.timedelta(days=30),
        )
        return user


class RegisterArtistSerializer(serializers.Serializer):
    artist_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6)
    sample_works = serializers.CharField(allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("این ایمیل قبلاً ثبت شده است.")
        return value


class UserSettingsSerializer(serializers.Serializer):
    locale = serializers.CharField(max_length=5, required=False)
    theme = serializers.CharField(max_length=8, required=False)
    extra = serializers.JSONField(required=False)
