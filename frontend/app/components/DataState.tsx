'use client';

import { motion } from "framer-motion";

type DataStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function DataState({ title, description, action }: DataStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-white/60 px-6 py-10 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <h3 className="text-lg font-semibold text-emerald-900">{title}</h3>
      {description ? <p className="text-sm text-emerald-900/70">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </motion.div>
  );
}
