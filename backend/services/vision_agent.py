from __future__ import annotations

import os
from typing import List, Optional

from agno.agent import Agent
from agno.media import Image
from agno.models.google import Gemini
from agno.tools.arxiv import ArxivTools
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.googlesearch import GoogleSearchTools
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError

load_dotenv()


class VisionAnalysis(BaseModel):
    plantName: Optional[str] = Field(None, alias="plantName")
    probableIssues: List[str] = Field(default_factory=list, alias="probableIssues")
    symptoms: List[str] = Field(default_factory=list)
    summary: str
    confidence: float = Field(..., ge=0, le=1)
    recommendations: List[str] = Field(default_factory=list)


VISION_PROMPT = """Anda adalah Plantify Vision Agent.

Instruksi penting:
- Fokus pada kesehatan tanaman berdasarkan gambar.
- Jangan memberikan diagnosis medis manusia.
- Jika ragu, turunkan confidence dan sebutkan ketidakpastian.
- Keluaran HARUS JSON valid sesuai schema.
- Maksimum 6 item dalam symptoms.
- probableIssues berisi daftar nama penyakit/hama potensial (boleh kosong).

Data tambahan pengguna:
- Catatan: {notes}
- Lokasi/negara: {country}
"""

vision_agent = Agent(
    model=Gemini(id="gemini-2.0-flash", api_key=os.getenv("GEMINI_API_KEY")),
    output_schema=VisionAnalysis,
    description="Kombinasikan analisis visual dan catatan pengguna untuk menyusun gejala tanaman.",
    instructions="""Kembalikan JSON dengan fields:
- plantName: nama tanaman (atau null jika tidak yakin)
- probableIssues: array penyakit/hama potensial
- symptoms: daftar gejala singkat berbasis observasi visual
- summary: rangkuman <=2 kalimat
- confidence: angka 0-1 yang menggambarkan keyakinan
- recommendations: tips singkat lanjutan (opsional)
Pastikan bahasa output mengikuti bahasa Indonesia.""",
    tools=[GoogleSearchTools(), DuckDuckGoTools(), ArxivTools()],
)


def analyze_plant_image(image_path: str, notes: Optional[str], country: str) -> VisionAnalysis:
    payload = VISION_PROMPT.format(
        notes=notes or "- (tidak ada)",
        country=country,
    )
    result = vision_agent.run(payload, images=[Image(filepath=image_path)])

    try:
        if isinstance(result.content, VisionAnalysis):
            return result.content
    except ValidationError as exc:
        raise ValueError(f"Vision agent output mismatch schema: {exc}\nRaw: {result.content}")


