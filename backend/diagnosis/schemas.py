from ninja import Schema

class ChecklistItemSchema(Schema):
    symptom: str
    aiDetected: bool
    userConfirmed: bool
    note: str | None = None

class RecommendationSchema(Schema):
    type: str
    title: str
    description: str          # ambil dari instructions
    caution: str | None = None
    references: list[int]

class SourceSchema(Schema):
    title: str
    url: str
    source: str
    publishedAt: str | None = None
    summary: str

class AdditionalRequestSchema(Schema):
    type: str
    message: str


class DiagnosisHistorySchema(Schema):
    id: int
    plantName: str | None
    issue: str
    confidence: float
    createdAt: str


class DiagnosisSchema(Schema):
    id: int
    plantName: str | None
    issue: str
    summary: str | None
    plantPart: str | None
    confidence: float
    consensusScore: float | None
    checklist: list[ChecklistItemSchema]
    recommendations: list[RecommendationSchema]
    sources: list[SourceSchema]
    additionalRequests: list[AdditionalRequestSchema]
    followUpQuestions: list[str]
    createdAt: str
