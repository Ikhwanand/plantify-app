from asgiref.sync import sync_to_async

from .models import ScanSession


def default_checklist(notes: str | None = None) -> list[str]:
    checklist = [
        "Periksa adanya bercak pada daun bagian atas dan bawah",
        "Perhatikan kondisi media tanam (lembap / tergenang)",
        "Cari tanda hama di permukaan daun atau batang",
    ]
    if notes:
        checklist.append(f"Tinjau catatan pengguna: {notes[:80]}{'…' if len(notes) > 80 else ''}")
    return checklist


async def create_scan(user, image_file, notes: str | None) -> ScanSession:
    return await sync_to_async(ScanSession.objects.create)(
        user=user,
        image=image_file,
        notes=notes or "",
    )


