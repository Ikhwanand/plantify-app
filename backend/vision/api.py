import asyncio
import logging
from typing import Optional, List

from asgiref.sync import sync_to_async
from ninja import File, Form, Schema
from ninja.files import UploadedFile
from ninja_extra import ControllerBase, api_controller, route, status
from ninja_extra.exceptions import NotFound, APIException

from ninja_extra.permissions import IsAuthenticated
from ninja_jwt.authentication import AsyncJWTAuth

from services.vision_agent import analyze_plant_image
from .models import ScanSession
from .schemas import ScanResponse
from .services import create_scan, default_checklist
import os 

logger = logging.getLogger(__name__)


class ScanUpdatePayload(Schema):
    notes: Optional[str] = None
    plantName: Optional[str] = None
    checklist: Optional[List[str]] = None
    
    
class MessageOut(Schema):
    message: str
    status: int 


@api_controller("/vision", tags=["Vision"], auth=AsyncJWTAuth(), permissions=[IsAuthenticated])
class VisionController(ControllerBase):
    @route.post("/scan", response=ScanResponse)
    async def scan(
        self,
        notes: str | None = Form(None),
        country: str | None = Form(None),
        image: UploadedFile = File(...),
    ):
        if not image:
            return APIException(code=status.HTTP_400_BAD_REQUEST, detail="Image is required")

        user = self.context.request.user
        scan = await create_scan(user, image, notes)

        analysis = None
        if scan.image:
            try:
                analysis = await asyncio.to_thread(
                    analyze_plant_image,
                    scan.image.path,
                    notes,
                    country or "Indonesia",
                )
            except ValueError as exc:
                logger.warning("Vision agent failed for scan %s: %s", scan.id, exc)

        if analysis:
            scan.plant_name = analysis.plantName or ""
            scan.checklist = analysis.symptoms or default_checklist(notes)
            scan.analysis_summary = analysis.summary
            scan.analysis_confidence = analysis.confidence
            scan.vision_metadata = analysis.model_dump(by_alias=True)
        else:
            scan.checklist = default_checklist(notes)
            scan.analysis_summary = "Analisis otomatis tidak tersedia. Ikuti pengecekan manual terlebih dahulu."
            scan.analysis_confidence = None
            scan.vision_metadata = {}

        await sync_to_async(scan.save)(
            update_fields=[
                "plant_name",
                "checklist",
                "analysis_summary",
                "analysis_confidence",
                "vision_metadata",
            ]
        )

        return self._serialize_scan(scan)

    @route.get("/scan/{scan_id}", response=ScanResponse)
    async def get_scan(self, scan_id: int):
        scan = await self._get_scan(scan_id)
        return self._serialize_scan(scan)

    @route.patch("/scan/{scan_id}", response=ScanResponse)
    async def update_scan(self, scan_id: int, payload: ScanUpdatePayload):
        scan = await self._get_scan(scan_id)
        data = payload.model_dump(exclude_unset=True)

        if "notes" in data:
            scan.notes = data["notes"] or ""
        if "plantName" in data:
            scan.plant_name = data["plantName"] or ""
        if "checklist" in data and data["checklist"]:
            scan.checklist = data["checklist"]

        await sync_to_async(scan.save)()
        return self._serialize_scan(scan)

    @route.delete("/scan/{scan_id}", response=MessageOut)
    async def delete_scan(self, scan_id: int):
        deleted = await sync_to_async(
            ScanSession.objects.filter(id=scan_id, user=self.context.request.user)
        )()
        image_path = deleted.image.path if deleted.image else None 
        if image_path:
            os.remove(image_path)
        deleted.delete()
        if deleted[0] == 0:
            return NotFound("Scan tidak ditemukan.")
        return MessageOut(message="Scan telah dihapus.", status=status.HTTP_204_NO_CONTENT)


    async def _get_scan(self, scan_id: int) -> ScanSession:
        try:
            return await sync_to_async(ScanSession.objects.get)(
                id=scan_id,
                user=self.context.request.user,
            )
        except ScanSession.DoesNotExist as exc:
            return NotFound(str(exc))

    def _serialize_scan(self, scan: ScanSession) -> ScanResponse:
        request = self.context.request
        preview_url = request.build_absolute_uri(scan.image.url) if scan.image else None
        metadata = scan.vision_metadata or {}

        return ScanResponse(
            scanId=str(scan.id),
            checklist=scan.checklist,
            plantName=scan.plant_name or None,
            notes=scan.notes or None,
            analysisSummary=scan.analysis_summary or None,
            confidence=scan.analysis_confidence,
            previewUrl=preview_url,
            suggestedIssues=metadata.get("probableIssues"),
        )
