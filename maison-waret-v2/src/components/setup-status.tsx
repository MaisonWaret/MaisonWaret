import { runtimeEnv } from "@/lib/env";

type SetupStatusProps = {
  compact?: boolean;
};

export function SetupStatus({ compact = false }: SetupStatusProps) {
  const configured = runtimeEnv.supabaseConfigured;

  return (
    <div
      className={`rounded-[24px] border px-5 py-4 ${
        configured
          ? "border-[#d5e8dc] bg-[#eef8f1] text-[#2f7d55]"
          : "border-[#ead6c9] bg-[#fff8f4] text-[#6f5b50]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">
        {configured ? "Mode Supabase public pret" : "Mode local actif"}
      </p>
      <p className={`mt-2 ${compact ? "text-sm leading-6" : "text-sm leading-7"}`}>
        {configured
          ? "Les variables publiques Supabase sont detectees. La V2 peut utiliser la vraie connexion et la session admin."
          : "La V2 fonctionne encore avec la logique locale pour les comptes. Des que tu renseignes les variables Supabase, on peut passer a l'auth et aux donnees reelles."}
      </p>
    </div>
  );
}
