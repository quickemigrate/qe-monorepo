import React from 'react';

interface SectionHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  center?: boolean;
}

const SectionHeader = ({ eyebrow, title, sub, center = false }: SectionHeaderProps) => (
  <div className={center ? 'text-center' : ''}>
    <div className={`inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)] ${center ? 'justify-center w-full' : ''}`}>
      <span className="w-6 h-px bg-[var(--brand-ink)]/60" />
      {eyebrow}
    </div>
    <h2 className="mt-4 text-[36px] md:text-[48px] font-semibold tracking-[-0.03em] leading-[1.05] text-[var(--ink)]">
      {title}
    </h2>
    {sub && (
      <p className="mt-4 text-[16px] leading-[1.6] text-[var(--ink)]/60 max-w-[520px]">
        {sub}
      </p>
    )}
  </div>
);

export default SectionHeader;
