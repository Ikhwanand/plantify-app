from django.db import models
from django.conf import settings

# Create your models here.
class ScanSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="scans")
    image = models.ImageField(upload_to="scans/")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    checklist = models.JSONField(default=list)
    plant_name = models.CharField(max_length=120, blank=True)
    analysis_summary = models.TextField(blank=True)
    analysis_confidence = models.FloatField(null=True, blank=True)
    vision_metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        label = self.plant_name or "Tanaman"
        return f"{self.user.username} - {label}"
