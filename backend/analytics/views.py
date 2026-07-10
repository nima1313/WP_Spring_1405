from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from catalog.serializers import TrackSerializer
from core.permissions import IsAdmin

from .models import ArtistMonthlyAccount
from .recommendations import recommend_for
from .serializers import AccountingRowSerializer
from .services import ensure_current_month_rows, monthly_revenue, user_distribution


class AccountingViewSet(ReadOnlyModelViewSet):
    serializer_class = AccountingRowSerializer

    def get_queryset(self):
        return ArtistMonthlyAccount.objects.select_related("artist").all()

    def list(self, request):
        ensure_current_month_rows()
        qs = self.get_queryset()
        if request.user.role == "admin":
            pass
        elif request.user.role == "artist" and request.user.artist_id:
            qs = qs.filter(artist_id=request.user.artist_id)
        else:
            raise PermissionDenied()
        return Response(AccountingRowSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"])
    def settle(self, request, pk=None):
        if request.user.role != "admin":
            raise PermissionDenied()
        row = self.get_object()
        row.status = "settled"
        row.save(update_fields=["status"])
        owner = getattr(row.artist, "user", None)
        if owner:
            from engagement.services import notify

            notify(
                owner, "monthly_finance", "تسویه پرداخت ماهانه",
                f"پاداش ماه {row.month} شما تسویه شد.", href="/studio",
            )
        return Response(AccountingRowSerializer(row).data)


class UserDistributionView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(user_distribution())


class MonthlyRevenueView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response({"revenue": monthly_revenue()})


class RecommendationsView(APIView):
    def get(self, request):
        tracks = recommend_for(request.user)
        return Response(TrackSerializer(tracks, many=True).data)
