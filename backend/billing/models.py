from django.db import models
from django.utils import timezone

from accounts.models import User
from core.models import short_id

PAID_TIERS = [("silver", "silver"), ("gold", "gold")]
PAYMENT_STATUS = [
    ("pending", "pending"),
    ("success", "success"),
    ("failed", "failed"),
]
PERIOD_CHOICES = [(1, "1"), (3, "3"), (6, "6"), (12, "12")]


class SubscriptionPlan(models.Model):
    """
    Runtime-editable price for a paid tier (§3.2). The admin PATCHes the price
    and it takes effect system-wide instantly — no code change, because every
    price reader pulls from this table.
    """

    tier = models.CharField(max_length=16, choices=PAID_TIERS, unique=True)
    monthly_price = models.PositiveIntegerField()
    currency = models.CharField(max_length=16, default="تومان")
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.tier}: {self.monthly_price}"


class Payment(models.Model):
    """A subscription purchase/renewal transaction (§3.6)."""

    id = models.CharField(primary_key=True, max_length=40, default=short_id("pay"))
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    tier = models.CharField(max_length=16, choices=PAID_TIERS)
    months = models.PositiveSmallIntegerField(choices=PERIOD_CHOICES)
    amount = models.PositiveIntegerField()
    gateway = models.CharField(max_length=16, default="mock")
    authority = models.CharField(max_length=128, blank=True, default="")
    ref_id = models.CharField(max_length=128, blank=True, default="")
    status = models.CharField(max_length=16, choices=PAYMENT_STATUS, default="pending")
    created_at = models.DateTimeField(default=timezone.now)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
