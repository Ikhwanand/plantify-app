'use client';

import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "./motionPresets";

const faqs = [
  {
    question: "Apakah Plantify membutuhkan koneksi internet?",
    answer:
      "Plantify mendukung mode offline. Diagnosis terakhir, logbook, dan checklist tetap bisa diakses. Fitur riset web butuh koneksi untuk akurasi optimal.",
  },
  {
    question: "Apakah rekomendasi bahan aktif aman digunakan?",
    answer:
      "Plantify hanya menyarankan bahan aktif yang umum digunakan dan menambahkan peringatan regulasi per negara. Selalu baca label dan ikuti regulasi lokal.",
  },
  {
    question: "Bisakah saya menyimpan riwayat diagnosa?",
    answer:
      "Ya. Riwayat scan dan logbook tersimpan secara lokal, dan bisa disinkronkan ke backend saat koneksi tersedia.",
  },
];

const FAQSection = () => {
  return (
    <motion.section
      id="faq"
      className="mt-28 section-wrapper"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <motion.div className="max-w-3xl space-y-4" variants={fadeInUp}>
        <h2 className="text-3xl font-semibold text-emerald-950">Pertanyaan yang Sering Diajukan</h2>
        <p className="text-sm text-emerald-900/70">
          Masih penasaran? Berikut jawaban singkat sebelum Anda mencoba Plantify.
        </p>
      </motion.div>
      <motion.div className="mt-8 space-y-3" variants={staggerChildren}>
        {faqs.map((faq, index) => (
          <motion.details
            key={faq.question}
            className="group border border-emerald-100 rounded-2xl bg-white/80 px-5 py-4 transition-shadow hover:shadow-md"
            variants={fadeInUp}
            transition={{ delay: index * 0.05 }}
          >
            <summary className="cursor-pointer text-emerald-900 font-medium flex justify-between items-center">
              {faq.question}
              <span className="text-emerald-500 group-open:rotate-180 transition-transform">v</span>
            </summary>
            <p className="mt-3 text-sm text-emerald-900/70 leading-6">{faq.answer}</p>
          </motion.details>
        ))}
      </motion.div>
    </motion.section>
  );
};

export default FAQSection;
