from __future__ import annotations

import os
from typing import List, Literal, Optional, Sequence

from agno.agent import Agent
from agno.media import Image
from agno.models.google import Gemini
from agno.tools.arxiv import ArxivTools
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.googlesearch import GoogleSearchTools
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError

load_dotenv()


class SourceSchema(BaseModel):
    title: str
    url: str
    source: str
    published_at: Optional[str] = Field(None, alias="publishedAt")
    summary: str


class RecommendationSchema(BaseModel):
    type: Literal["non_chemical", "active_ingredient"]
    title: str
    instructions: str
    caution: Optional[str] = None
    references: List[int]


class DiagnosticChecklistItem(BaseModel):
    symptom: str
    ai_detected: bool = Field(..., alias="aiDetected")
    user_confirmed: bool = Field(..., alias="userConfirmed")
    note: Optional[str] = None


class AdditionalRequest(BaseModel):
    type: Literal["need_more_images", "safe_action", "monitoring", "escalation"]
    message: str


class DiagnosisResult(BaseModel):
    issue: str
    confidence: float
    summary: str
    plant_part: Optional[str] = Field(None, alias="plantPart")


class AgentResponse(BaseModel):
    diagnosis: DiagnosisResult
    checklist: List[DiagnosticChecklistItem]
    recommendations: List[RecommendationSchema]
    sources: List[SourceSchema]
    consensus_score: Optional[float] = Field(None, alias="consensusScore")
    additional_requests: List[AdditionalRequest] = Field(default_factory=list, alias="additionalRequests")
    follow_up_questions: List[str] = Field(default_factory=list, alias="followUpQuestions")


USER_PROMPT_TEMPLATE = """Gejala terkonfirmasi:
{confirmed_symptoms}

Gejala ditolak user:
{denied_symptoms}

Data Vision AI:
- Tanaman: {plant_name}
- Confidence vision: {vision_confidence}
- Catatan user: {user_notes}

Lokasi pengguna: {country}
Catatan regulasi bahan aktif: {regulation_hint}

Tugas:
1. Tentukan diagnosis utama dengan confidence 0-1 dan ringkas reasoning (≤ 3 kalimat).
2. Cocokkan minimal 2 sumber kredibel. Jika sumber terbatas, jelaskan.
3. Kembalikan checklist lengkap (AI vs user).
4. Beri rekomendasi non-kimia dulu, lalu bahan aktif (maks 3). Sertakan cara pakai & peringatan.
5. Daftar sumber lengkap dengan ringkasan.
6. Hitung consensus_score = jumlah sumber yang mendukung rekomendasi utama / total sumber.
7. Jika butuh data tambahan, isi additional_requests atau follow_up_questions.
8. Output JSON sesuai skema yang diberikan.
"""


agent = Agent(
    model=Gemini(id="gemini-2.0-flash", api_key=os.getenv("GEMINI_API_KEY")),
    output_schema=AgentResponse,
    description="Anda adalah Agen Bukti AgriCare untuk Plantify.",
    instructions="""Anda adalah Agen Bukti AgriCare untuk Plantify.
Aturan:
1. Selalu mencari bukti eksternal (fokus pada lembaga penelitian pertanian, FAO, IRRI, penyuluhan universitas, buletin pemerintah, jurnal ilmiah dan buku ilmiah).
2. Setiap rekomendasi harus mencantumkan minimal satu sumber terpercaya.
3. Prioritaskan praktik budaya non-kimia sebelum menyarankan bahan aktif.
4. Sebutkan peringatan regulasi untuk bahan aktif tergantung negara pengguna.
5. Jika bukti lemah atau bertentangan, turunkan tingkat kepercayaan dan minta informasi lebih lanjut dengan aman.
6. Output HARUS berupa JSON yang valid sesuai skema yang diberikan.
7. Fokus ketat pada kesehatan tanaman; jangan memberikan saran medis untuk manusia.
8. Jika situasi dapat menyebabkan kerugian panen besar, pertimbangkan saran eskalasi (konsultasi dengan agronom).
""",
    tools=[GoogleSearchTools(), DuckDuckGoTools(), ArxivTools()],
)


def generate_diagnosis(
    confirmed_symptoms: Sequence[str],
    denied_symptoms: Sequence[str],
    plant_name: Optional[str] = None,
    vision_confidence: Optional[float] = None,
    user_notes: Optional[str] = None,
    country: str = "Indonesia",
    regulation_hint: str = "Cek regulasi lokal Kementan.",
    image_url: Optional[str] = None,
) -> AgentResponse:
    payload = USER_PROMPT_TEMPLATE.format(
        confirmed_symptoms="\n".join(f"- {symptom}" for symptom in confirmed_symptoms) or "- (tidak ada)",
        denied_symptoms="\n".join(f"- {symptom}" for symptom in denied_symptoms) or "- (tidak ada)",
        plant_name=plant_name or "Tidak diketahui",
        vision_confidence=f"{vision_confidence:.2f}" if vision_confidence is not None else "Tidak tersedia",
        user_notes=user_notes or "(tidak ada catatan tambahan)",
        country=country,
        regulation_hint=regulation_hint,
    )

    result = agent.run(payload, images=[Image(filepath=image_url)] if image_url else None)

    try:
        if isinstance(result.content, AgentResponse):
            return result.content
    except ValidationError as exc:
        raise ValueError(f"AI response does not match schema: {exc}\nRaw: {result.content}")






