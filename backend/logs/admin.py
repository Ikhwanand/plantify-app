from django.contrib import admin
from .models import LogEntry, Reminder
# Register your models here.
admin.site.register(LogEntry)
admin.site.register(Reminder)