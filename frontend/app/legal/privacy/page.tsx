export const metadata = {
  title: "Plantify | Kebijakan Privasi",
};

import { LegalContent } from "../LegalContent";

export default function PrivacyPage() {
  return (
    <LegalContent
      title="Kebijakan Privasi"
      intro="Plantify menghargai privasi Anda. Foto tanaman, checklist gejala, dan hasil diagnosis hanya digunakan untuk meningkatkan akurasi AI. Kami tidak membagikan data ke pihak ketiga tanpa persetujuan tertulis."
      sections={[
        {
          heading: "1. Pengumpulan data",
          body: "Kami mengumpulkan foto, metadata perangkat, dan input checklist untuk memproses diagnosis. Data logbook dan pengingat disimpan secara lokal kecuali Anda mengaktifkan sinkronisasi backend.",
        },
        {
          heading: "2. Penyimpanan & keamanan",
          body: "Server Plantify berjalan di wilayah Asia Tenggara dengan enkripsi at-rest dan in-transit. Akses internal dibatasi oleh peran.",
        },
        {
          heading: "3. Hak pengguna",
          body: "Anda dapat meminta penghapusan data atau ekspor riwayat diagnosis melalui email support@plantify.agri.",
        },
      ]}
    />
  );
}
