'use client';

import { motion } from "framer-motion";

type SectionCardProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
};

export function SectionCard({ title, description, children, footer }: SectionCardProps) {
  return (
    <motion.section
      className="section-wrapper mt-10"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <motion.div className="glass-card px-6 py-6 lg:px-10 lg:py-8 space-y-6">
        <header>
          <h2 className="text-xl font-semibold text-emerald-950">{title}</h2>
          {description ? <p className="mt-2 text-sm text-emerald-900/70">{description}</p> : null}
        </header>
        {children}
        {footer ? <footer className="pt-4 border-t border-emerald-100">{footer}</footer> : null}
      </motion.div>
    </motion.section>
  );
}
