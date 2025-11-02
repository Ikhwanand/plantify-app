export const metadata = {
  title: "Plantify | Syarat & Ketentuan",
};

import { LegalContent } from "../LegalContent";

export default function TermsPage() {
  return (
    <LegalContent
      title="Syarat & Ketentuan"
      intro="Pahami batasan dan tanggung jawab selama menggunakan Plantify versi beta agar pengalaman tetap aman dan sesuai regulasi."
      sections={[
        {
          heading: "1. Penggunaan layanan",
          body: "Plantify disediakan untuk membantu diagnosis awal tanaman. Keputusan akhir perawatan tetap berada pada pengguna dengan memperhatikan regulasi lokal.",
        },
        {
          heading: "2. Batasan tanggung jawab",
          body: "Kami tidak bertanggung jawab atas kerusakan tanaman yang terjadi akibat penerapan rekomendasi tanpa verifikasi lapangan atau konsultasi ahli.",
        },
        {
          heading: "3. Perubahan syarat",
          body: "Plantify dapat memperbarui syarat layanan sewaktu-waktu. Pengguna akan diinformasikan melalui aplikasi.",
        },
      ]}
    />
  );
}
