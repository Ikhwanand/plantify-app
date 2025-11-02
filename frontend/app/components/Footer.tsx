'use client';

import { motion } from "framer-motion";
import { fadeInUp } from "./motionPresets";

export function Footer() {
  return (
    <motion.footer
      className="mt-24 pb-10"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeInUp}
    >
      <div className="section-wrapper border-t border-emerald-100 pt-6 text-sm text-emerald-900/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p>&copy; {new Date().getFullYear()} Plantify. Evidence-first plant care.</p>
        <motion.div className="flex gap-4" variants={fadeInUp}>
          <a href="/legal/privacy">Kebijakan Privasi</a>
          <a href="/legal/terms">Syarat & Ketentuan</a>
          <a href="#fitur">Peta Produk</a>
        </motion.div>
      </div>
    </motion.footer>
  );
}
