'use client';

import { motion } from "framer-motion";
import { FiGlobe, FiCpu, FiLayers, FiCloudLightning } from "react-icons/fi";
import { fadeInUp, staggerChildren } from "./motionPresets";

const features = [
  {
    icon: FiCpu,
    title: "Vision AI + Agen Bukti",
    description: "AI Vision dan agen riset mengurai gejala, mencari sumber relevan, dan menyusun perawatan.",
  },
  {
    icon: FiLayers,
    title: "Checklist Gejala Manual",
    description: "Konfirmasi hasil AI dengan daftar gejala supaya diagnosis lebih tepat sebelum keputusan akhir.",
  },
  {
    icon: FiGlobe,
    title: "Context Aware",
    description: "Filter rekomendasi berdasarkan regulasi negara dan bahasa lokal otomatis.",
  },
  {
    icon: FiCloudLightning,
    title: "Offline-Ready PWA",
    description: "Gunakan Plantify meski tanpa internet, simpan hasil dan log perawatan secara lokal.",
  },
];

const FeaturesSection = () => {
  return (
    <motion.section
      id="fitur"
      className="mt-28 section-wrapper"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      <motion.div className="text-center space-y-4 max-w-3xl mx-auto" variants={fadeInUp}>
        <h2 className="text-3xl font-semibold text-emerald-950">Fitur yang Menjawab Kebutuhan Petani Modern</h2>
        <p className="text-base text-emerald-900/70">
          Dari diagnosis hingga logbook perawatan, Plantify membuat setiap keputusan berbasis bukti dan mudah diikuti.
        </p>
      </motion.div>
      <motion.div
        className="mt-12 grid gap-6 md:grid-cols-2"
        variants={staggerChildren}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        {features.map((feature) => (
          <motion.article key={feature.title} className="glass-card px-6 py-6 flex gap-4" variants={fadeInUp}>
            <feature.icon className="mt-1 text-emerald-600" size={28} />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-emerald-900">{feature.title}</h3>
              <p className="text-sm text-emerald-900/70">{feature.description}</p>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  );
};

export default FeaturesSection;
