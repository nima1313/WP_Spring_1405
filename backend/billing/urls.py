from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PaymentCallbackView, PaymentViewSet, PlansView

router = DefaultRouter(trailing_slash=False)
router.register("payments", PaymentViewSet, basename="payment")

urlpatterns = [
    path("plans", PlansView.as_view()),
    # Explicit paths before the router so /payments/callback isn't read as a pk.
    path("payments/callback", PaymentCallbackView.as_view()),
    path("", include(router.urls)),
]
