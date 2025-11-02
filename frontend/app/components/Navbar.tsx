'use client';

import { useState } from "react";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import { fadeInUp, slideFromTop, staggerChildren } from "./motionPresets";

const navItems = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#testimoni", label: "Testimoni" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-6 z-30">
      <motion.nav
        className="section-wrapper"
        initial="hidden"
        animate="visible"
        variants={slideFromTop}
      >
        <motion.div
          className="glass-card px-6 py-4 flex items-center justify-between"
          variants={fadeInUp}
        >
          <Link
            href={"/"}
            className="text-2xl font-semibold tracking-tight text-emerald-900"
          >
            Plantify
          </Link>

          <motion.div
            className="hidden md:flex items-center gap-8 text-sm font-medium text-emerald-800"
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
          >
            {navItems.map((item) => (
              <motion.div key={item.href} variants={fadeInUp}>
                <Link
                  href={item.href}
                  className="hover:text-emerald-600 transition-colors"
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
            <motion.div variants={fadeInUp}>
              <Link
                href={"/auth"}
                className="rounded-full bg-emerald-600 px-5 py-2 text-white shadow-sm shadow-emerald-200 hover:bg-emerald-500 transition-colors"
              >
                Mulai
              </Link>
            </motion.div>
          </motion.div>

          <button
            className="md:hidden text-emerald-900"
            aria-label="Toggle menu"
            onClick={() => setOpen((prev) => !prev)}
          >
              {open ? <FiX size={28} /> : <FiMenu size={28} />}
          </button>
        </motion.div>

        {open && (
          <motion.div
            className="mt-3 glass-card px-6 py-4 flex flex-col gap-4 md:hidden text-emerald-900"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={"/auth"}
              onClick={() => setOpen(false)}
              className="rounded-full bg-emerald-600 px-5 py-2 text-center text-white font-medium"
            >
              Coba Gratis
            </Link>
          </motion.div>
        )}
      </motion.nav>
    </header>
  );
}
