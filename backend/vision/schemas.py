from ninja import Schema

class ScanResponse(Schema):
    scanId: str
    checklist: list[str]
    previewUrl: str | None = None
    notes: str | None = None
    plantName: str | None = None
    analysisSummary: str | None = None
    confidence: float | None = None
    suggestedIssues: list[str] | None = None
