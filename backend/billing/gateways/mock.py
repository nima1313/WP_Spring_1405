import secrets
from urllib.parse import quote

from django.conf import settings

from .base import InitiateResult, PaymentGateway


class MockGateway(PaymentGateway):
    """
    Local, internet-free driver. `initiate` points the user at an in-app page
    with confirm/fail buttons; `verify` reads the resulting Status query param.
    Lets demos and CI run the full purchase flow without a live gateway.
    """

    name = "mock"

    def initiate(self, payment, callback_url: str) -> InitiateResult:
        authority = f"MOCK-{secrets.token_hex(8)}"
        # Same-origin path so the browser reaches it through the Next.js proxy.
        pay_page = f"{settings.FRONTEND_URL}/api/payments/{payment.id}/mock-pay"
        return InitiateResult(
            redirect_url=f"{pay_page}?callback={quote(callback_url, safe='')}",
            authority=authority,
        )

    def verify(self, payment, request) -> bool:
        return request.query_params.get("Status") == "OK"
