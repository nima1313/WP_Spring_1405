from django.conf import settings

from .base import InitiateResult, PaymentGateway


class ZarinpalGateway(PaymentGateway):
    """
    Zarinpal sandbox driver (REST v4). Amounts are sent in Rial (Toman × 10).
    Docs: https://docs.zarinpal.com/paymentGateway/
    """

    name = "zarinpal"

    @property
    def _base(self) -> str:
        host = "sandbox.zarinpal.com" if settings.ZARINPAL_SANDBOX else "payment.zarinpal.com"
        return f"https://{host}/pg"

    def initiate(self, payment, callback_url: str) -> InitiateResult:
        import requests

        resp = requests.post(
            f"{self._base}/v4/payment/request.json",
            json={
                "merchant_id": settings.ZARINPAL_MERCHANT_ID,
                "amount": payment.amount * 10,  # Toman → Rial
                "callback_url": callback_url,
                "description": f"اشتراک {payment.tier} ({payment.months} ماه) — Nava",
            },
            timeout=20,
        )
        data = resp.json().get("data") or {}
        authority = data.get("authority")
        if not authority:
            raise RuntimeError("Zarinpal did not return an authority.")
        return InitiateResult(
            redirect_url=f"{self._base}/StartPay/{authority}",
            authority=authority,
        )

    def verify(self, payment, request) -> bool:
        import requests

        if request.query_params.get("Status") != "OK":
            return False
        resp = requests.post(
            f"{self._base}/v4/payment/verify.json",
            json={
                "merchant_id": settings.ZARINPAL_MERCHANT_ID,
                "amount": payment.amount * 10,
                "authority": payment.authority,
            },
            timeout=20,
        )
        data = resp.json().get("data") or {}
        # 100 = verified, 101 = already verified
        if data.get("code") in (100, 101):
            payment.ref_id = str(data.get("ref_id", ""))
            return True
        return False
