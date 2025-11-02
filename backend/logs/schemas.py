from ninja import Schema
from datetime import datetime


class LogEntrySchema(Schema):
    id: int
    title: str 
    note: str 
    performedAt: datetime 
    category: str 
    

class ReminderSchema(Schema):
    id: int
    title: str 
    scheduledFor: datetime 
    description: str | None 
    frequency: str 
    
