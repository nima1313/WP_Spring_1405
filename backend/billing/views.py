from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from core.permissions import IsAdmin

from .gateways import get_gateway
from .models import Payment, SubscriptionPlan
from .serializers import PaymentSerializer, PurchaseSerializer
from .services import apply_subscription, price_for, prices_payload


class PlansView(APIView):
    """GET prices (any user) / PATCH prices (admin only, §3.2 runtime pricing)."""

    def get(self, request):
        return Response(prices_payload())

    def patch(self, request):
        if request.user.role != "admin":
            raise PermissionDenied()
        for tier in ("silver", "gold"):
            if tier in request.data:
                SubscriptionPlan.objects.update_or_create(
                    tier=tier,
                    defaults={
                        "monthly_price": int(request.data[tier]),
                        "updated_at": timezone.now(),
                    },
                )
        return Response(prices_payload())


class PaymentViewSet(ReadOnlyModelViewSet):
    """List/detail own payments (§3.6 status tracking)."""

    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)

    def create(self, request):
        if request.user.role != "listener":
            raise PermissionDenied("فقط شنوندگان می‌توانند اشتراک خریداری کنند.")
        serializer = PurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tier = serializer.validated_data["tier"]
        months = int(serializer.validated_data["months"])

        unit = price_for(tier)
        if unit <= 0:
            raise ValidationError({"detail": "قیمت این اشتراک تعریف نشده است."})

        payment = Payment.objects.create(
            user=request.user, tier=tier, months=months,
            amount=unit * months, gateway=settings.PAYMENT_GATEWAY,
        )
        callback_url = (
            f"{settings.FRONTEND_URL}/api/payments/callback?payment={payment.id}"
        )
        result = get_gateway(payment.gateway).initiate(payment, callback_url)
        payment.authority = result.authority
        payment.save(update_fields=["authority"])
        return Response(
            {"payment_id": payment.id, "redirect_url": result.redirect_url},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="mock-pay",
            permission_classes=[AllowAny])
    def mock_pay(self, request, pk=None):
        """The mock gateway's fake bank page (confirm/fail)."""
        payment = Payment.objects.filter(id=pk).first()
        if not payment:
            return HttpResponse("پرداخت یافت نشد.", status=404)
        callback = request.query_params.get("callback", "")
        ok = f"{callback}&Status=OK&Authority={payment.authority}"
        no = f"{callback}&Status=NOK&Authority={payment.authority}"
        html = f"""<!doctype html><html lang="fa" dir="rtl"><head>
<meta charset="utf-8"><title>درگاه آزمایشی Nava</title>
<style>body{{font-family:sans-serif;background:#0f1020;color:#fff;display:flex;
min-height:100vh;align-items:center;justify-content:center;margin:0}}
.card{{background:#1b1d33;padding:32px;border-radius:16px;text-align:center;max-width:360px}}
a{{display:inline-block;margin:8px;padding:12px 20px;border-radius:10px;
text-decoration:none;color:#fff}} .ok{{background:#22c55e}} .no{{background:#ef4444}}</style>
</head><body><div class="card"><h2>درگاه پرداخت آزمایشی</h2>
<p>مبلغ: {payment.amount:,} تومان — اشتراک {payment.tier} ({payment.months} ماه)</p>
<a class="ok" href="{ok}">پرداخت موفق</a>
<a class="no" href="{no}">لغو پرداخت</a></div></body></html>"""
        return HttpResponse(html)


class PaymentCallbackView(APIView):
    """Gateway return URL — verifies and redirects back to the settings page."""

    permission_classes = [AllowAny]

    def get(self, request):
        payment = Payment.objects.filter(id=request.query_params.get("payment")).first()
        target = f"{settings.FRONTEND_URL}/settings"
        if not payment or payment.status != "pending":
            return HttpResponseRedirect(f"{target}?payment=failed")

        gateway = get_gateway(payment.gateway)
        if gateway.verify(payment, request):
            payment.status = "success"
            payment.verified_at = timezone.now()
            payment.save()
            apply_subscription(payment)
            return HttpResponseRedirect(f"{target}?payment=success")

        payment.status = "failed"
        payment.save(update_fields=["status"])
        return HttpResponseRedirect(f"{target}?payment=failed")
