"""Billing domain logic: price lookup and subscription application."""

from django.utils import timezone

from .models import Payment, SubscriptionPlan


def prices_payload() -> dict:
    """Assemble the frontend `Prices` shape from the two plan rows."""
    plans = {p.tier: p for p in SubscriptionPlan.objects.all()}
    silver = plans.get("silver")
    gold = plans.get("gold")
    updated = max(
        [p.updated_at for p in plans.values()], default=timezone.now()
    )
    return {
        "silver": silver.monthly_price if silver else 0,
        "gold": gold.monthly_price if gold else 0,
        "currency": (silver or gold).currency if (silver or gold) else "تومان",
        "updated_at": updated,
    }


def price_for(tier: str) -> int:
    plan = SubscriptionPlan.objects.filter(tier=tier).first()
    return plan.monthly_price if plan else 0


def apply_subscription(payment: Payment) -> None:
    """
    Grant the purchased tier and extend expiry by months×30 days. Renewal stacks
    on top of any remaining time (extends from max(now, current expiry)).
    """
    user = payment.user
    now = timezone.now()
    base = user.subscription_expires_at
    if not base or base < now:
        base = now
    user.tier = payment.tier
    user.subscription_expires_at = base + timezone.timedelta(days=30 * payment.months)
    user.save(update_fields=["tier", "subscription_expires_at"])
