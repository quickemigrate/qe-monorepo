import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PLANS } from '../data';

const ServicesSection = () => (
  <section id="servicios" className="py-24 px-6 bg-on-background text-white">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.02em] mb-4">
          Elige tu plan
        </h2>
        <p className="text-white/50 text-lg font-medium">
          Transparencia desde el primer día. Sin letra pequeña.
        </p>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: i * 0.08 }}
            className={`relative flex flex-col rounded-[20px] p-7 transition-all
              ${plan.isPopular
                ? 'border-2 bg-white/6'
                : plan.isFree
                ? 'border border-white/10 bg-transparent'
                : 'border border-white/10 bg-white/4'
              }`}
            style={plan.isPopular ? { borderColor: 'var(--brand)' } : undefined}
          >
            {/* Popular badge */}
            {plan.isPopular && (
              <div
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full
                           text-[11px] font-black uppercase tracking-widest whitespace-nowrap"
                style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
              >
                Más popular
              </div>
            )}

            {/* Plan name */}
            <div className="mb-5">
              <span className={`text-[12px] font-bold uppercase tracking-[0.14em] ${plan.isPopular ? 'text-white' : 'text-white/40'}`}>
                {plan.name}
              </span>
            </div>

            {/* Price */}
            <div className="mb-1">
              <span className="text-[42px] font-extrabold tracking-[-0.03em] leading-none">
                {plan.price}
              </span>
            </div>
            {plan.period && (
              <div className="text-[13px] text-white/40 font-medium mb-4">{plan.period}</div>
            )}
            {!plan.period && <div className="mb-4" />}

            {/* Description */}
            <p className="text-[14px] text-white/55 leading-[1.55] mb-6 flex-none">
              {plan.description}
            </p>

            {/* Features */}
            <ul className="flex-1 space-y-2.5 mb-8">
              {plan.features.map(feature => (
                <li key={feature} className="flex items-start gap-2.5">
                  <span
                    className="mt-[3px] w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'var(--brand)' }}
                  >
                    <Check size={10} strokeWidth={3} style={{ color: 'var(--brand-ink)' }} />
                  </span>
                  <span className="text-[13.5px] text-white/70 leading-[1.45]">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            {plan.id === 'starter' ? (
              <Link
                to="/diagnostico"
                className={`block w-full py-3.5 rounded-full font-bold text-[14.5px] text-center transition-all
                  hover:scale-[1.03] active:scale-[0.97] bg-white/10 text-white hover:bg-white/16`}
              >
                {plan.cta}
              </Link>
            ) : (
              <a
                href={plan.ctaLink}
                className={`block w-full py-3.5 rounded-full font-bold text-[14.5px] text-center transition-all
                  hover:scale-[1.03] active:scale-[0.97]
                  ${plan.isPopular
                    ? 'text-on-background'
                    : 'bg-white/10 text-white hover:bg-white/16'
                  }`}
                style={plan.isPopular ? { background: 'var(--brand)', color: 'var(--brand-ink)' } : undefined}
              >
                {plan.cta}
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;
