import type { Metadata } from "next";
import LandingPage from "./LandingPage/page";

export const metadata: Metadata = {
  title: "Plantify | Landing",
  description:
    "Mulai perjalanan perawatan tanaman berbasis AI dengan Plantify. Daftar gratis dan nikmati diagnosis Vision AI, checklist gejala, dan logbook.",
};

export default function HomePage() {
  return <LandingPage />;
}
