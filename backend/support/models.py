from django.db import models
from django.utils import timezone

from accounts.models import User
from core.models import short_id

TICKET_STATUS_CHOICES = [
    ("open", "open"),
    ("answered", "answered"),
    ("closed", "closed"),
]


class Ticket(models.Model):
    id = models.CharField(primary_key=True, max_length=40, default=short_id("tk"))
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tickets")
    subject = models.CharField(max_length=200)
    status = models.CharField(
        max_length=16, choices=TICKET_STATUS_CHOICES, default="open"
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]


class TicketMessage(models.Model):
    id = models.CharField(primary_key=True, max_length=40, default=short_id("m"))
    ticket = models.ForeignKey(
        Ticket, on_delete=models.CASCADE, related_name="messages"
    )
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    body = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at"]

    @property
    def author_role(self) -> str:
        return "support" if self.author.role in ("support", "admin") else "user"
