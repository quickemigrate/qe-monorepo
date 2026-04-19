import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Faq } from '../types';
import { FAQS } from '../data';

const FaqItem: React.FC<Faq> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-on-background/10 py-5">
      <button
        className="w-full flex justify-between items-center text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-semibold text-on-background">{question}</span>
        {isOpen ? <ChevronUp className="text-on-background/40" /> : <ChevronDown className="text-on-background/40" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-4 text-on-background/60 leading-relaxed max-w-2xl">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FaqSection = () => (
  <section className="py-24 px-6 bg-surface-container-low">
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-5xl font-bold text-on-background mb-12 text-center">Dudas frecuentes</h2>
      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <FaqItem key={i} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  </section>
);

export default FaqSection;
