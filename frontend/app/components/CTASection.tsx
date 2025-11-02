'use client';

import { FormEvent } from "react";
import { motion } from "framer-motion";
import { FiMail } from "react-icons/fi";
import { fadeInUp } from "./motionPresets";

export function CTASection() {
  return (
    <motion.section
      id="mulai"
      className="mt-28 section-wrapper"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      <motion.div
        className="glass-card px-8 py-10 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white"
        variants={fadeInUp}
      >
        <motion.div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center" variants={fadeInUp}>
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold">Siap membawa perawatan tanaman ke level berikutnya?</h2>
            <p className="text-sm text-emerald-50/90">
              Gabung beta Plantify dan dapatkan akses ke Vision AI, agen bukti ilmiah, serta fitur logbook gratis.
            </p>
          </div>
          <motion.form
            className="flex flex-col sm:flex-row gap-3"
            variants={fadeInUp}
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = event.currentTarget;
              const email = (form.elements.namedItem("email") as HTMLInputElement).value;
              console.log("TODO: kirim email ke backend", email);
            }}
          >
            <label className="relative flex-1">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-200" />
              <input
                type="email"
                name="email"
                required
                placeholder="Email Anda"
                className="w-full rounded-full border border-emerald-400/40 bg-white/15 px-12 py-3 text-sm placeholder:text-emerald-100/70 focus:outline-none focus:ring-2 focus:ring-white/60"
              />
            </label>
            <motion.button
              type="submit"
              className="rounded-full bg-white text-emerald-600 font-semibold px-6 py-3 shadow-lg hover:-translate-y-0.5 transition-transform"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Join Beta
            </motion.button>
          </motion.form>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
