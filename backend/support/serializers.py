from rest_framework import serializers

from .models import Ticket, TicketMessage


class TicketMessageSerializer(serializers.ModelSerializer):
    author_role = serializers.CharField(read_only=True)

    class Meta:
        model = TicketMessage
        fields = ["id", "author_role", "body", "created_at"]


class TicketSerializer(serializers.ModelSerializer):
    user_id = serializers.CharField(read_only=True)
    user_name = serializers.CharField(source="user.display_name", read_only=True)
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id", "user_id", "user_name", "subject", "status",
            "created_at", "messages",
        ]
