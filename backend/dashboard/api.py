from datetime import timedelta

from asgiref.sync import sync_to_async
from django.db.models import Avg, Count, Q
from django.utils import timezone
from ninja import Schema
from ninja_extra import ControllerBase, api_controller, route
from ninja_extra.permissions import IsAuthenticated
from ninja_jwt.authentication import AsyncJWTAuth

from community.models import CommunityPost
from diagnosis.models import Diagnosis

class MetricSchema(Schema):
    label: str 
    value: str | float | int 
    delta: float | None = None 


def _relative_delta(current: int | float | None, previous: int | float | None) -> float | None:
    if current is None or previous is None or previous == 0:
        return None 
    return round(((current - previous) / (previous) * 100), 1)


def _percent_point_delta(current: float | None, previous: float | None) -> float | None:
    if current is None or previous is None:
        return None 
    return round(current - previous, 1)


def _to_percent(value: float | None) -> float | None:
    if value is None:
        return None 
    return round(value * 100, 1)


def _format_percent(value: float | None) -> str:
    if value is None:
        return "0%"
    return f"{value:.1f}%"


@api_controller("/dashboard", tags=["Dashboard"], auth=AsyncJWTAuth(), permissions=[IsAuthenticated])
class DashboardController(ControllerBase):
    @route.get("/metrics", response=list[MetricSchema])
    async def metrics(self):
        now = timezone.now()
        last_7_days = now - timedelta(days=7)
        prev_7_days = last_7_days - timedelta(days=7)
        
        def _diagnosis_counts():
            qs = Diagnosis.objects.all()
            total = qs.count()
            last_week = qs.filter(created_at__gte=last_7_days).count()
            previous_week = qs.filter(created_at__gte=prev_7_days, created_at__lt=last_7_days).count()
            return total, last_week, previous_week
        
        def _confidence_stats():
            qs = Diagnosis.objects.all()
            overall = qs.aggregate(avg=Avg("confidence"))["avg"]
            recent = qs.filter(created_at__gte=last_7_days).aggregate(avg=Avg("confidence"))["avg"]
            previous = qs.filter(created_at__gte=prev_7_days, created_at__lt=last_7_days).aggregate(avg=Avg("confidence"))["avg"]
            return overall,  recent, previous
        
        
        def _top_issue_stats():
            qs = Diagnosis.objects.exclude(issue__isnull=True).exclude(issue__exact="")
            most_common = (
                qs.values("issue")
                .annotate(total=Count("id"))
                .order_by("-total", "issue")
                .first()
            )
            if not most_common:
                return None 
            issue = most_common["issue"]
            recent = qs.filter(issue=issue, created_at__gte=last_7_days).count()
            previous = qs.filter(issue=issue, created_at__gte=prev_7_days, created_at__lt=last_7_days).count()
            return {"issue": issue, "total": most_common["total"], "recent_total": recent, "previous_total": previous}
        
        
        def _feedback_stats():
            aggregate = CommunityPost.objects.aggregate(
                total=Count("id"),
                positive=Count("id", filter=Q(upvotes__gt=0)),
                recent_total=Count("id", filter=Q(created_at__gte=last_7_days)),
                recent_positive=Count("id", filter=Q(created_at__gte=last_7_days, upvotes__gt=0)),
                previous_total=Count("id", filter=Q(created_at__gte=prev_7_days, created_at__lt=last_7_days)),
                previous_positive=Count("id", filter=Q(created_at__gte=prev_7_days, created_at__lt=last_7_days, upvotes__gt=0)),
            )
            return aggregate
        
        
        total_diagnoses, last_week_diagnoses, prev_week_diagnoses = await sync_to_async(
            _diagnosis_counts, thread_sensitive=True
        )()
        overall_avg, recent_avg, previous_avg = await sync_to_async(
            _confidence_stats, thread_sensitive=True
        )()
        top_issue = await sync_to_async(_top_issue_stats, thread_sensitive=True)()
        feedback = await sync_to_async(_feedback_stats, thread_sensitive=True)()
        
        metrics: list[MetricSchema] = [
            MetricSchema(
                label="Total Diagnosis",
                value=total_diagnoses,
                delta=_relative_delta(last_week_diagnoses, prev_week_diagnoses),
            )
        ]
        
        overall_avg_percent = _to_percent(overall_avg)
        recent_avg_percent = _to_percent(recent_avg)
        previous_avg_percent = _to_percent(previous_avg)
        metrics.append(
            MetricSchema(
                label="Confidence Rata-rata",
                value=_format_percent(overall_avg_percent),
                delta=_percent_point_delta(recent_avg_percent, previous_avg_percent),
            )
        )
        
        if top_issue:
            metrics.append(
                MetricSchema(
                    label="Penyakit Teratas",
                    value=f"{top_issue['issue']} ({top_issue['total']})",
                    delta=_relative_delta(top_issue["recent_total"], top_issue["previous_total"]),
                )
            )
        else:
            metrics.append(
                MetricSchema(
                    label="Penyakit Teratas",
                    value="Belum ada data",
                    delta=None,
                )
            )
        
        total_posts = feedback["total"]
        positive_posts = feedback["positive"]
        overall_feedback_percent = _to_percent((positive_posts / total_posts) if total_posts else None)
        recent_feedback_percent = _to_percent(
            (feedback["recent_positive"] / feedback["recent_total"]) if feedback["recent_total"] else None
        )
        previous_feedback_percent = _to_percent(
            (feedback["previous_positive"] / feedback["previous_total"]) if feedback["previous_total"] else None
        )
        metrics.append(
            MetricSchema(
                label="Feedback Positif",
                value=_format_percent(overall_feedback_percent),
                delta=_percent_point_delta(recent_feedback_percent, previous_feedback_percent),
            )
        )

        return metrics