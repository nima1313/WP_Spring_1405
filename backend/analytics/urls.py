from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AccountingViewSet,
    MonthlyRevenueView,
    RecommendationsView,
    UserDistributionView,
)

router = DefaultRouter(trailing_slash=False)
router.register("accounting", AccountingViewSet, basename="accounting")

urlpatterns = [
    path("stats/user-distribution", UserDistributionView.as_view()),
    path("stats/monthly-revenue", MonthlyRevenueView.as_view()),
    path("me/recommendations", RecommendationsView.as_view()),
    path("", include(router.urls)),
]
