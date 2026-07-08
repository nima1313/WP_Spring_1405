from django.contrib import admin

from .models import Artist, User, Verification

admin.site.register(User)
admin.site.register(Artist)
admin.site.register(Verification)
