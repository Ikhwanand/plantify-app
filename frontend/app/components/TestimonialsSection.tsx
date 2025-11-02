'use client';

import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "./motionPresets";

const testimonials = [
  {
    quote:
      "Checklist gejala membuat saya lebih yakin sebelum menyemprot pestisida. Confidence meter-nya membantu memutuskan langkah lanjutan.",
    name: "Andi - Petani Cabai",
    location: "Bandung, Indonesia",
  },
  {
    quote:
      "Mode ilmiah Plantify memudahkan saya mencari referensi paper terbaru untuk kasus penyakit tanaman hias koleksi pelanggan.",
    name: "Sarah - Konsultan Hortikultura",
    location: "Singapore",
  },
  {
    quote:
      "Logbook offline-nya berguna sekali saat inspeksi lapangan tanpa sinyal. Semua diagnosis lama tersimpan rapi.",
    name: "Rama - Agronomis",
    location: "Yogyakarta, Indonesia",
  },
];

const TestimonialsSection = () => {
  return (
    <motion.section
      id="testimoni"
      className="mt-28 section-wrapper"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      <motion.div className="glass-card px-8 py-10 bg-white" variants={fadeInUp}>
        <motion.div className="max-w-3xl space-y-4" variants={fadeInUp}>
          <span className="text-sm font-semibold text-emerald-700 uppercase">Apa kata mereka</span>
          <h2 className="text-3xl font-semibold text-emerald-950">
            Plantify sudah membantu komunitas petani dan pecinta tanaman di Asia Tenggara.
          </h2>
        </motion.div>
        <motion.div
          className="mt-10 grid gap-6 md:grid-cols-3"
          variants={staggerChildren}
          initial="hidden"
          whileInView="visible"
        >
          {testimonials.map((item) => (
            <motion.div
              key={item.name}
              className="space-y-3 border border-emerald-100 rounded-2xl px-5 py-6 bg-emerald-50/60"
              variants={fadeInUp}
            >
              <p className="text-sm text-emerald-900/80 leading-6">&ldquo;{item.quote}&rdquo;</p>
              <div className="text-sm font-semibold text-emerald-900">{item.name}</div>
              <div className="text-xs text-emerald-900/60">{item.location}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default TestimonialsSection;
