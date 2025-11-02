from django.db import models
from django.conf import settings

# Create your models here.
class Diagnosis(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="diagnoses")
    scan = models.ForeignKey("vision.ScanSession", on_delete=models.CASCADE, related_name="diagnoses")
    issue = models.CharField(max_length=255)
    summary = models.TextField(blank=True)
    plant_part = models.CharField(max_length=120, blank=True)
    confidence = models.FloatField(default=0.0)
    checklist = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    sources = models.JSONField(default=list)
    additional_requests = models.JSONField(default=list)
    follow_up_questions = models.JSONField(default=list)
    consensus_score = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.issue}"