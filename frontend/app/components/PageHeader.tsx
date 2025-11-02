'use client';

import { motion } from "framer-motion";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <motion.div
      className="section-wrapper flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div>
        <h1 className="text-3xl font-semibold text-emerald-950">{title}</h1>
        {subtitle ? <p className="text-sm text-emerald-900/70 mt-1">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-col sm:flex-row gap-3">{actions}</div> : null}
    </motion.div>
  );
}
