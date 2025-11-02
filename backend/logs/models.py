from django.db import models
from django.conf import settings
# Create your models here.

class LogEntry(models.Model):
    CATEGORY_CHOICES = [
        ("watering", "Watering"),
        ("fertilizing", "Fertilizing"),
        ("treatment", "Treatment"),
        ("observation", "Observation"),
        ("other", "Other"),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="log_entries")
    title = models.CharField(max_length=255)
    note = models.TextField()
    performed_at = models.DateTimeField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="observation")
    created_at = models.DateTimeField(auto_now_add=True)


class Reminder(models.Model):
    FREQUENCY_CHOICES = [
        ("once", "Sekali"),
        ("weekly", "Mingguan"),
        ("monthly", "Bulanan")
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reminders")
    title = models.CharField(max_length=200)
    scheduled_at = models.DateTimeField()
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default="once")
    created_at = models.DateTimeField(auto_now_add=True)