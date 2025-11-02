'use client';

import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "../components/motionPresets";

type LegalSection = {
  heading: string;
  body: string;
};

type LegalContentProps = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalContent({ title, intro, sections }: LegalContentProps) {
  return (
    <motion.div
      className="section-wrapper py-16 space-y-8"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={staggerChildren}
    >
      <motion.h1 className="text-3xl font-semibold text-emerald-950" variants={fadeInUp}>
        {title}
      </motion.h1>
      <motion.p className="text-sm text-emerald-900/70" variants={fadeInUp}>
        {intro}
      </motion.p>
      {sections.map((section) => (
        <motion.section key={section.heading} className="space-y-3" variants={fadeInUp}>
          <h2 className="text-xl font-semibold text-emerald-950">{section.heading}</h2>
          <p className="text-sm text-emerald-900/70">{section.body}</p>
        </motion.section>
      ))}
    </motion.div>
  );
}
