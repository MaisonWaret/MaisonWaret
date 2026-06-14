import Link from "next/link";

import { ADMIN_LOGIN_PATH } from "@/lib/admin-path";
import { getServerSupabaseEnv, runtimeEnv } from "@/lib/env";

const setupSteps = [
  {
    title: "Creer le projet Supabase",
    description:
      "Creer un projet Supabase neuf, puis recuperer le Project URL, la anon key et la service role key.",
  },
  {
    title: "Configurer les variables",
    description:
      "Copier `.env.example` vers `.env.local`, puis remplir `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`.",
  },
  {
    title: "Executer le schema SQL",
    description:
      "Dans SQL Editor, lancer `supabase-schema-v2.sql`, puis `supabase-rls-v2.sql` pour activer les tables et la securite.",
  },
  {
    title: "Activer l'auth email",
    description:
      "Dans Authentication, laisser Email actif pour gerer ensuite le vrai login admin principal, manager et employe.",
  },
  {
    title: "Me donner les infos finales",
    description:
      "Quand les variables sont en place et le SQL execute, je branche la vraie auth et je remplace le mode local par la base reelle.",
  },
];

const envRows = [
  {
    label: "NEXT_PUBLIC_SUPABASE_URL",
    value: runtimeEnv.supabaseUrl || "non configure",
  },
  {
    label: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / ANON_KEY",
    value: runtimeEnv.supabaseAnonKey ? "configure" : "non configure",
  },
  {
    label: "SUPABASE_SERVICE_ROLE_KEY",
    value: getServerSupabaseEnv().serviceRoleConfigured ? "configure" : "non configure",
  },
];

export default function SupabaseSetupPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf6_0%,#f8efe8_100%)]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="rounded-[34px] border border-white/70 bg-white/88 p-8 shadow-[0_22px_55px_rgba(91,54,35,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4f34]">
            Setup Supabase
          </p>
          <h1 className="mt-3 font-serif text-5xl text-[#2d1d17]">
            Branchement de la vraie V2
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#6f5b50]">
            Cette page te sert de checklist rapide pour passer de la V2 locale a la vraie V2 avec
            auth, roles et commandes en base.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-[#ead6c9] bg-[#fff8f4] px-5 py-3 text-sm font-semibold text-[#6f5b50] hover:-translate-y-0.5 hover:text-[#8a4f34]"
            >
              Retour au site
            </Link>
            <Link
              href={ADMIN_LOGIN_PATH}
              className="rounded-full border border-[#ead6c9] bg-[#fff8f4] px-5 py-3 text-sm font-semibold text-[#6f5b50] hover:-translate-y-0.5 hover:text-[#8a4f34]"
            >
              Aller a la connexion
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Etapes
            </p>
            <div className="mt-6 grid gap-4">
              {setupSteps.map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-[22px] bg-[#fff8f4] p-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#8a4f34] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2d1d17]">{step.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#6f5b50]">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Verification locale
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
              Etat actuel des variables
            </h2>
            <div className="mt-6 grid gap-3">
              {envRows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-[22px] border border-[#efddd2] bg-[#fffaf7] px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
                    {row.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6f5b50]">{row.value}</p>
                </div>
              ))}
              <div className="rounded-[22px] border border-[#efddd2] bg-[#fffaf7] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
                  Fichiers a lancer
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6f5b50]">
                  `supabase-schema-v2.sql` puis `supabase-rls-v2.sql`
                </p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
