from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vision", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="scansession",
            name="analysis_confidence",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="scansession",
            name="analysis_summary",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="scansession",
            name="vision_metadata",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
