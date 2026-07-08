from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone

from core.models import short_id

ROLE_CHOICES = [
    ("listener", "listener"),
    ("artist", "artist"),
    ("support", "support"),
    ("admin", "admin"),
]
TIER_CHOICES = [("basic", "basic"), ("silver", "silver"), ("gold", "gold")]
GENDER_CHOICES = [("male", "male"), ("female", "female"), ("other", "other")]
VERIFICATION_CHOICES = [
    ("pending", "pending"),
    ("approved", "approved"),
    ("rejected", "rejected"),
]


class UserManager(BaseUserManager):
    """Email-based manager (the frontend logs in with email, not username)."""

    use_in_migrations = True

    def _create(self, email, password, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("role", "listener")
        extra.setdefault("tier", "basic")
        return self._create(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("role", "admin")
        extra.setdefault("tier", "gold")
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        if not extra.get("handle"):
            extra["handle"] = f"@nava_{email.split('@')[0][:8]}"
        if not extra.get("display_name"):
            extra["display_name"] = email.split("@")[0]
        return self._create(email, password, **extra)


class Artist(models.Model):
    """A public artist profile (نمایه هنرمند). Owned by a User when claimed."""

    id = models.CharField(primary_key=True, max_length=40, default=short_id("ar"))
    name = models.CharField(max_length=120)
    pro_id = models.CharField(max_length=40, unique=True)
    bio = models.TextField(blank=True, default="")
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    verified = models.BooleanField(default=False)
    status = models.CharField(
        max_length=16, choices=VERIFICATION_CHOICES, default="pending"
    )
    rejection_reason = models.CharField(max_length=255, blank=True, default="")
    sample_works = models.TextField(blank=True, default="")
    email = models.EmailField()
    # Denormalized counters (like phase 1): the follow edges below track *who*
    # follows, while these hold the displayed totals so seeded demo numbers and
    # live toggles coexist. monthly_listeners is refreshed by the stats service.
    follower_count = models.PositiveIntegerField(default=0)
    monthly_listeners = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class User(AbstractUser):
    """
    Custom user (§1.2/§3.2). Email is the login field; ``username`` is dropped
    in favour of the system-assigned ``handle`` shown on the profile.
    """

    username = None
    first_name = None
    last_name = None

    id = models.CharField(primary_key=True, max_length=40, default=short_id("u"))
    handle = models.CharField(max_length=40, unique=True)
    display_name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default="listener")
    tier = models.CharField(max_length=16, choices=TIER_CHOICES, default="basic")
    subscription_expires_at = models.DateTimeField(null=True, blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    birthday = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=8, choices=GENDER_CHOICES, null=True, blank=True
    )
    bio = models.TextField(blank=True, default="")
    follower_count = models.PositiveIntegerField(default=0)
    artist = models.OneToOneField(
        Artist, null=True, blank=True, on_delete=models.SET_NULL, related_name="user"
    )
    created_at = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.email

    @property
    def is_subscription_active(self) -> bool:
        return bool(
            self.subscription_expires_at
            and self.subscription_expires_at > timezone.now()
        )

    @property
    def effective_tier(self) -> str:
        """
        Tier actually in force. A listener whose subscription has lapsed falls
        back to `basic` — so expiry is enforced everywhere a gate reads this,
        without a cron job flipping rows. Staff/artist accounts keep their tier.
        """
        if self.role == "listener" and not self.is_subscription_active:
            return "basic"
        return self.tier


class UserFollow(models.Model):
    """Listener → listener follow edge (§3.3 social graph)."""

    follower = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="following_users"
    )
    target = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="user_followers"
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("follower", "target")


class ArtistFollow(models.Model):
    """Listener → artist follow edge."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="following_artists"
    )
    artist = models.ForeignKey(
        Artist, on_delete=models.CASCADE, related_name="followers"
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("user", "artist")


class Verification(models.Model):
    """Artist verification request queued for staff review (§2.11.2)."""

    id = models.CharField(primary_key=True, max_length=40, default=short_id("vf"))
    artist = models.ForeignKey(
        Artist, on_delete=models.CASCADE, related_name="verifications"
    )
    status = models.CharField(
        max_length=16, choices=VERIFICATION_CHOICES, default="pending"
    )
    reason = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]


class UserSettings(models.Model):
    """Cross-device preferences (§3.5) — synced instead of living in localStorage."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="settings"
    )
    locale = models.CharField(max_length=5, default="fa")
    theme = models.CharField(max_length=8, default="system")
    extra = models.JSONField(default=dict, blank=True)
