'use client';

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiCamera, FiShield, FiTrendingUp } from "react-icons/fi";
import { fadeInUp, staggerChildren, delayedStaggerChildren } from "./motionPresets";

const HeroSection = () => {
  return (
    <motion.section
      className="section-wrapper mt-20 grid gap-10 md:grid-cols-[1.05fr_0.95fr] items-center"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={staggerChildren}
    >
      <motion.div className="space-y-8" variants={fadeInUp}>
        <motion.span
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-1 text-xs font-medium text-emerald-700"
          variants={fadeInUp}
        >
          <FiShield /> Evidence-first plant care
        </motion.span>
        <motion.h1
          className="text-4xl md:text-5xl font-semibold leading-tight text-emerald-950"
          variants={fadeInUp}
        >
          Diagnosa Tanaman Lebih Cepat dengan AI yang Mengutamakan Bukti
        </motion.h1>
        <motion.p className="max-w-xl text-base md:text-lg text-emerald-900/80" variants={fadeInUp}>
          Plantify memadukan Vision AI dan agen penelusur web untuk memberikan diagnosa akurat, rekomendasi bahan aktif,
          serta langkah perawatan yang aman untuk setiap kondisi tanaman.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
          variants={fadeInUp}
        >
          <Link
            href="/auth"
            className="rounded-full bg-emerald-600 px-6 py-3 text-white font-medium shadow-lg shadow-emerald-200 hover:bg-emerald-500 transition-transform hover:-translate-y-0.5"
          >
            Mulai Diagnosa
          </Link>
          <a
            href="#fitur"
            className="rounded-full px-6 py-3 font-semibold text-emerald-700 bg-white/60 hover:bg-white/90 border border-emerald-200"
          >
            Lihat Fitur
          </a>
        </motion.div>
        <motion.div className="grid gap-6 sm:grid-cols-3 pt-4" variants={delayedStaggerChildren}>
          {[
            {
              icon: FiCamera,
              label: "Scan Tanaman",
              desc: "AI Vision & checklist gejala",
            },
            {
              icon: FiShield,
              label: "Aman",
              desc: "Bahan aktif & peringatan regulasi",
            },
            {
              icon: FiTrendingUp,
              label: "Terukur",
              desc: "Confidence meter + citations",
            },
          ].map((item) => (
            <motion.div key={item.label} className="glass-card px-5 py-4 flex flex-col gap-2" variants={fadeInUp}>
              <item.icon className="text-emerald-600" size={24} />
              <p className="text-sm font-semibold text-emerald-900">{item.label}</p>
              <p className="text-xs text-emerald-900/70">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div className="relative" variants={fadeInUp} transition={{ duration: 0.8, delay: 0.2 }}>
        <div className="absolute -top-10 -left-10 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
        <motion.div className="glass-card overflow-hidden" variants={fadeInUp}>
          <Image
            src={"/image-1.jpg"}
            alt="Plantify AI diagnosis preview"
            width={720}
            height={720}
            className="object-cover h-full w-full"
            priority
          />
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default HeroSection;
