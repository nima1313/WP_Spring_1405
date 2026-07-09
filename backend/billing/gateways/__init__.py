"""
Payment gateway strategy (§3.6).

`get_gateway()` returns the driver selected by settings.PAYMENT_GATEWAY. Every
driver implements the same `initiate`/`verify` contract, so the purchase views
never know which gateway is in play — the mock driver is used for offline demos
and grading, the Zarinpal sandbox driver for the real integration.
"""

from django.conf import settings

from .base import PaymentGateway
from .mock import MockGateway
from .zarinpal import ZarinpalGateway

_REGISTRY = {
    "mock": MockGateway,
    "zarinpal": ZarinpalGateway,
}


def get_gateway(name: str | None = None) -> PaymentGateway:
    key = (name or settings.PAYMENT_GATEWAY or "mock").lower()
    return _REGISTRY.get(key, MockGateway)()


__all__ = ["PaymentGateway", "MockGateway", "ZarinpalGateway", "get_gateway"]
