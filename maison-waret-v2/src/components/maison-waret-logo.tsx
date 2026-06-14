type MaisonWaretLogoProps = {
  compact?: boolean;
  className?: string;
};

export function MaisonWaretLogo({
  compact = false,
  className = "",
}: MaisonWaretLogoProps) {
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
        <span className="grid h-12 w-12 place-items-center rounded-full border border-[#cda98f] bg-[linear-gradient(135deg,#f8efe8,#fffaf6)] text-lg font-semibold text-[#8a5a3c] shadow-[0_12px_24px_rgba(138,90,60,0.16)]">
          MW
        </span>
        <span>
          <strong className="block font-serif text-xl leading-none text-[#2d1d17]">
            Maison Waret
          </strong>
          <small className="block pt-1 text-xs uppercase tracking-[0.22em] text-[#8a5a3c]">
            Le gout authentique
          </small>
        </span>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`.trim()}>
      <div className="mx-auto flex max-w-[420px] items-center gap-4 text-[#a17152]">
        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(161,113,82,0),rgba(161,113,82,0.8))]" />
        <span className="text-xs uppercase tracking-[0.34em]">Maison</span>
        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(161,113,82,0.8),rgba(161,113,82,0))]" />
      </div>
      <h2 className="mt-3 font-serif text-5xl italic leading-none text-[#5a3927] sm:text-6xl">
        Waret
      </h2>
      <p className="mt-3 text-sm uppercase tracking-[0.28em] text-[#8a5a3c]">
        Le gout authentique
      </p>
      <p className="mt-3 text-sm text-[#8f786c]">L&apos;authenticite a chaque bouchee.</p>
    </div>
  );
}
