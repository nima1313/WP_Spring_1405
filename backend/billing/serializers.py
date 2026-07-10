from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id", "tier", "months", "amount", "gateway",
            "status", "created_at", "verified_at",
        ]


class PurchaseSerializer(serializers.Serializer):
    tier = serializers.ChoiceField(choices=["silver", "gold"])
    months = serializers.ChoiceField(choices=[1, 3, 6, 12])
