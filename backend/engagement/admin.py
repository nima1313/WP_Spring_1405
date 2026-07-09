from django.contrib import admin

from .models import Notification, Playlist, StreamEvent

admin.site.register(Playlist)
admin.site.register(Notification)
admin.site.register(StreamEvent)
