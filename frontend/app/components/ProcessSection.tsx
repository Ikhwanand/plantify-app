'use client';

import Image from "next/image";
import { motion } from "framer-motion";
import { FiUploadCloud, FiSearch, FiClipboard, FiCheckCircle } from "react-icons/fi";
import { fadeInUp, staggerChildren } from "./motionPresets";

const steps = [
  {
    icon: FiUploadCloud,
    title: "1. Upload atau Foto",
    content: "Ambil gambar tanaman langsung dari dashboard scan Plantify",
  },
  {
    icon: FiSearch,
    title: "2. Vision + Checklist",
    content: "AI Vision mendeteksi pola penyakit; cek list gejala untuk konfirmasi manual.",
  },
  {
    icon: FiClipboard,
    title: "3. Diagnosis & Bukti",
    content: "Agen AI mencari sumber terpercaya, menampilkan confidence meter dan kutipan.",
  },
  {
    icon: FiCheckCircle,
    title: "4. Rekomendasi Aman",
    content: "Plantify menyarankan langkah organik lalu bahan aktif sesuai regulasi negara Anda.",
  },
];

const ProcessSection = () => {
  return (
    <motion.section
      id="cara-kerja"
      className="mt-28 section-wrapper grid gap-10 lg:grid-cols-[1fr_1fr] items-center"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      variants={staggerChildren}
    >
      <motion.div className="glass-card overflow-hidden" variants={fadeInUp}>
        <Image
          src={"/image-3.jpg"}
          alt="Plantify process illustration"
          width={800}
          height={600}
          className="w-full h-full object-cover"
        />
      </motion.div>
      <motion.div className="space-y-6" variants={fadeInUp}>
        <motion.span
          className="text-sm font-semibold tracking-wide text-emerald-700 uppercase"
          variants={fadeInUp}
        >
          Cara Kerja
        </motion.span>
        <motion.h2 className="text-3xl font-semibold text-emerald-950" variants={fadeInUp}>
          Langkah Sederhana, Output Komprehensif
        </motion.h2>
        <motion.div className="space-y-5" variants={staggerChildren}>
          {steps.map((step) => (
            <motion.div key={step.title} className="flex gap-4 items-start" variants={fadeInUp}>
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <step.icon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-900">{step.title}</h3>
                <p className="text-sm text-emerald-900/70">{step.content}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default ProcessSection;
