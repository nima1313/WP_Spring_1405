from django.contrib import admin

from .models import Payment, SubscriptionPlan

admin.site.register(SubscriptionPlan)
admin.site.register(Payment)
