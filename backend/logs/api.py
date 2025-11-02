from datetime import datetime
from typing import Optional

from asgiref.sync import sync_to_async
from ninja import Schema
from ninja_extra import ControllerBase, api_controller, route, status
from ninja_extra.exceptions import NotFound
from ninja_extra.permissions import IsAuthenticated
from ninja_jwt.authentication import AsyncJWTAuth

from .models import LogEntry, Reminder
from .schemas import LogEntrySchema, ReminderSchema


class LogEntryCreate(Schema):
    title: str
    note: str
    performedAt: datetime
    category: str


class LogEntryUpdate(Schema):
    title: Optional[str] = None
    note: Optional[str] = None
    performedAt: Optional[datetime] = None
    category: Optional[str] = None


class ReminderCreate(Schema):
    title: str
    scheduledFor: datetime
    description: Optional[str] = None
    frequency: str


class ReminderUpdate(Schema):
    title: Optional[str] = None
    scheduledFor: Optional[datetime] = None
    description: Optional[str] = None
    frequency: Optional[str] = None


class MessageOut(Schema):
    message: str 
    status: int 



@api_controller("/logs", tags=["Logbook"], auth=AsyncJWTAuth(), permissions=[IsAuthenticated])
class LogbookController(ControllerBase):
    @route.get("/", response=list[LogEntrySchema])
    async def list_logs(self):
        user = self.context.request.user
        entries = await sync_to_async(
            lambda: list(LogEntry.objects.filter(user=user).order_by("-performed_at"))
        )()
        return [
            LogEntrySchema(
                id=entry.id,
                title=entry.title,
                note=entry.note,
                performedAt=entry.performed_at,
                category=entry.category,
            )
            for entry in entries
        ]

    @route.post("/", response=LogEntrySchema)
    async def create_log(self, payload: LogEntryCreate):
        user = self.context.request.user
        entry = await sync_to_async(LogEntry.objects.create)(
            user=user,
            title=payload.title,
            note=payload.note,
            performed_at=payload.performedAt,
            category=payload.category,
        )
        return LogEntrySchema(
            id=entry.id,
            title=entry.title,
            note=entry.note,
            performedAt=entry.performed_at,
            category=entry.category,
        )

    @route.patch("/{log_id}", response=LogEntrySchema)
    async def update_log(self, log_id: int, payload: LogEntryUpdate):
        user = self.context.request.user
        try:
            entry = await sync_to_async(LogEntry.objects.get)(id=log_id, user=user)
        except LogEntry.DoesNotExist as exc:
            return NotFound(str(exc))

        data = payload.model_dump(exclude_unset=True)
        if "performedAt" in data:
            data["performed_at"] = data.pop("performedAt")

        for field, value in data.items():
            setattr(entry, field, value)

        await sync_to_async(entry.save)()
        return LogEntrySchema(
            id=entry.id,
            title=entry.title,
            note=entry.note,
            performedAt=entry.performed_at,
            category=entry.category,
        )

    @route.delete("/{log_id}", response=MessageOut)
    async def delete_log(self, log_id: int):
        user = self.context.request.user
        deleted = await sync_to_async(LogEntry.objects.filter(id=log_id, user=user).delete)()
        if deleted[0] == 0:
            raise NotFound("Log entry not found.")
        return MessageOut(message="Log berhasil dihapus.", status=status.HTTP_204_NO_CONTENT)


@api_controller("/reminders", tags=["Reminder"], auth=AsyncJWTAuth(), permissions=[IsAuthenticated])
class ReminderController(ControllerBase):
    @route.get("/", response=list[ReminderSchema])
    async def list_reminders(self):
        user = self.context.request.user
        reminders = await sync_to_async(
            lambda: list(Reminder.objects.filter(user=user).order_by("-scheduled_at"))
        )()
        return [
            ReminderSchema(
                id=reminder.id,
                title=reminder.title,
                scheduledFor=reminder.scheduled_at,
                description=reminder.description,
                frequency=reminder.frequency,
            )
            for reminder in reminders
        ]

    @route.post("/", response=ReminderSchema)
    async def create_reminder(self, payload: ReminderCreate):
        user = self.context.request.user
        reminder = await sync_to_async(Reminder.objects.create)(
            user=user,
            title=payload.title,
            scheduled_at=payload.scheduledFor,
            description=payload.description or "",
            frequency=payload.frequency,
        )
        return ReminderSchema(
            id=reminder.id,
            title=reminder.title,
            scheduledFor=reminder.scheduled_at,
            description=reminder.description,
            frequency=reminder.frequency,
        )

    @route.patch("/{reminder_id}", response=ReminderSchema)
    async def update_reminder(self, reminder_id: int, payload: ReminderUpdate):
        user = self.context.request.user
        try:
            reminder = await sync_to_async(Reminder.objects.get)(id=reminder_id, user=user)
        except Reminder.DoesNotExist as exc:
            raise NotFound(str(exc))

        data = payload.model_dump(exclude_unset=True)
        if "scheduledFor" in data:
            data["scheduled_at"] = data.pop("scheduledFor")

        for field, value in data.items():
            if field == "description" and value is None:
                value = ""
            setattr(reminder, field, value)

        await sync_to_async(reminder.save)()
        return ReminderSchema(
            id=reminder.id,
            title=reminder.title,
            scheduledFor=reminder.scheduled_at,
            description=reminder.description,
            frequency=reminder.frequency,
        )

    @route.delete("/{reminder_id}", response=MessageOut)
    async def delete_reminder(self, reminder_id: int):
        user = self.context.request.user
        deleted = await sync_to_async(Reminder.objects.filter(id=reminder_id, user=user).delete)()
        if deleted[0] == 0:
            raise NotFound("Reminder not found.")
        return MessageOut(message="Reminder berhasil dihapus.", status=status.HTTP_204_NO_CONTENT)
