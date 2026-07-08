from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Ticket, TicketMessage
from .serializers import TicketSerializer


class TicketViewSet(ModelViewSet):
    serializer_class = TicketSerializer

    def get_queryset(self):
        qs = Ticket.objects.prefetch_related("messages").all()
        if self.request.user.role not in ("support", "admin"):
            qs = qs.filter(user=self.request.user)
        return qs

    def _visible(self):
        ticket = self.get_object()
        if ticket.user_id != self.request.user.id and self.request.user.role not in (
            "support", "admin"):
            raise PermissionDenied()
        return ticket

    def create(self, request):
        subject = request.data.get("subject", "").strip()
        body = request.data.get("body", "").strip()
        if not subject or not body:
            raise ValidationError({"detail": "موضوع و متن پیام الزامی است."})
        ticket = Ticket.objects.create(user=request.user, subject=subject, status="open")
        TicketMessage.objects.create(ticket=ticket, author=request.user, body=body)
        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        return Response(TicketSerializer(self._visible()).data)

    def partial_update(self, request, pk=None):
        """Status change — staff only (§2.11.2)."""
        if request.user.role not in ("support", "admin"):
            raise PermissionDenied()
        ticket = self.get_object()
        new_status = request.data.get("status")
        if new_status not in ("open", "answered", "closed"):
            raise ValidationError({"detail": "وضعیت نامعتبر است."})
        ticket.status = new_status
        ticket.save(update_fields=["status"])
        return Response(TicketSerializer(ticket).data)

    @action(detail=True, methods=["post"], url_path="messages")
    def reply(self, request, pk=None):
        ticket = self._visible()
        body = request.data.get("body", "").strip()
        if not body:
            raise ValidationError({"detail": "متن پیام الزامی است."})
        TicketMessage.objects.create(ticket=ticket, author=request.user, body=body)
        is_staff = request.user.role in ("support", "admin")
        ticket.status = "answered" if is_staff else "open"
        ticket.save(update_fields=["status"])
        return Response(TicketSerializer(ticket).data)
