import asyncio

from asgiref.sync import sync_to_async
from django.db import transaction
from ninja import Schema
from ninja_extra import ControllerBase, api_controller, route, status
from ninja_extra.exceptions import NotFound, APIException
from ninja_extra.permissions import IsAuthenticated
from ninja_jwt.authentication import AsyncJWTAuth

from services.ai_agent import AgentResponse, generate_diagnosis
from vision.models import ScanSession

from .models import Diagnosis
from .schemas import DiagnosisHistorySchema, DiagnosisSchema


class ChecklistPayload(Schema):
    scanId: int
    confirmedSymptoms: list[str]
    deniedSymptoms: list[str]


class DiagnosisCreateOut(Schema):
    diagnosisId: int


class MessageOut(Schema):
    message: str 
    status: int 

@api_controller("/diagnosis", auth=AsyncJWTAuth(), permissions=[IsAuthenticated], tags=["Diagnosis"])
class DiagnosisController(ControllerBase):
    @route.post("/checklist", response=DiagnosisCreateOut)
    async def submit_checklist(self, payload: ChecklistPayload):
        user = self.context.request.user

        try:
            scan = await sync_to_async(ScanSession.objects.get)(
                id=payload.scanId,
                user=user,
            )
        except ScanSession.DoesNotExist as exc:
            return NotFound(str(exc))


        try:
            agent_result: AgentResponse = await asyncio.to_thread(
                generate_diagnosis,
                confirmed_symptoms=payload.confirmedSymptoms,
                denied_symptoms=payload.deniedSymptoms,
                plant_name=scan.plant_name or None,
                vision_confidence=scan.analysis_confidence,
                user_notes=scan.notes or None,
                country="Indonesia",
                regulation_hint="Ikuti regulasi Kementan setempat.",
                image_url=scan.image.path if scan.image else None,
            )
        except ValueError as exc:
            return APIException(code=status.HTTP_400_BAD_REQUEST, detail=f"Agen AI gagal memproses: {exc}")

        def _persist() -> int:
            with transaction.atomic():
                scan.checklist = payload.confirmedSymptoms
                scan.save(update_fields=["checklist"])

                diagnosis = Diagnosis.objects.create(
                    user=user,
                    scan=scan,
                    issue=agent_result.diagnosis.issue,
                    summary=agent_result.diagnosis.summary,
                    plant_part=agent_result.diagnosis.plant_part or "",
                    confidence=agent_result.diagnosis.confidence,
                    consensus_score=agent_result.consensus_score,
                    checklist=[item.model_dump(by_alias=True) for item in agent_result.checklist],
                    recommendations=[
                        {
                            "type": rec.type,
                            "title": rec.title,
                            "description": rec.instructions,
                            "caution": rec.caution,
                            "references": rec.references,
                        }
                        for rec in agent_result.recommendations
                    ],
                    sources=[source.model_dump(by_alias=True) for source in agent_result.sources],
                    additional_requests=[req.model_dump() for req in agent_result.additional_requests],
                    follow_up_questions=agent_result.follow_up_questions,
                )
                return diagnosis.id

        diagnosis_id = await sync_to_async(_persist, thread_sensitive=True)()
        return DiagnosisCreateOut(diagnosisId=diagnosis_id)

    @route.get("/{diagnosis_id}", response=DiagnosisSchema)
    async def get_diagnosis(self, diagnosis_id: int):
        user = self.context.request.user
        diagnosis = await sync_to_async(Diagnosis.objects.select_related("scan").get)(
            id=diagnosis_id,
            user=user,
        )
        return DiagnosisSchema(
            id=diagnosis.id,
            plantName=diagnosis.scan.plant_name,
            issue=diagnosis.issue,
            summary=diagnosis.summary,
            plantPart=diagnosis.plant_part or None,
            confidence=diagnosis.confidence,
            consensusScore=diagnosis.consensus_score,
            checklist=diagnosis.checklist,
            recommendations=diagnosis.recommendations,
            sources=diagnosis.sources,
            additionalRequests=diagnosis.additional_requests,
            followUpQuestions=diagnosis.follow_up_questions,
            createdAt=diagnosis.created_at.isoformat(),
        )

    @route.get("/", response=list[DiagnosisHistorySchema])
    async def list_diagnoses(self):
        user = self.context.request.user
        diagnoses = await sync_to_async(
            lambda: list(
                Diagnosis.objects.filter(user=user)
                .select_related("scan")
                .order_by("-created_at")
            )
        )()
        return [
            DiagnosisHistorySchema(
                id=item.id,
                plantName=item.scan.plant_name or None,
                issue=item.issue,
                confidence=item.confidence,
                createdAt=item.created_at.isoformat(),
            )
            for item in diagnoses
        ]

    @route.delete("/{diagnosis_id}", response=MessageOut)
    async def delete_diagnosis(self, diagnosis_id: int):
        user = self.context.request.user

        def _delete():
            try:
                diagnosis = Diagnosis.objects.select_related("scan").get(id=diagnosis_id, user=user)
            except Diagnosis.DoesNotExist as exc:
                raise NotFound(str(exc))

            scan = diagnosis.scan
            image_path = scan.image.path if scan.image else None

            if image_path:
                import os
                if os.path.exists(image_path):
                    os.remove(image_path)

            scan.delete()
            diagnosis.delete()

        try:
            await sync_to_async(_delete, thread_sensitive=True)()
        except NotFound:
            raise

        return MessageOut(message="Diagnosis berhasil dihapus.", status=status.HTTP_204_NO_CONTENT)
        
    
