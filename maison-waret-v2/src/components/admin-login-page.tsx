"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SetupStatus } from "@/components/setup-status";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-path";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ActiveTab = "login" | "register";

export function AdminLoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [activeTab, setActiveTab] = useState<ActiveTab>("login");
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [hasExistingUsers, setHasExistingUsers] = useState<boolean | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const response = await fetch("/api/admin/bootstrap-status", {
          cache: "no-store",
        });

        if (!cancelled) {
          if (response.ok) {
            const data = (await response.json()) as { hasOwner: boolean };
            setHasExistingUsers(data.hasOwner);
          } else {
            setHasExistingUsers(false);
          }
        }
      } catch {
        if (!cancelled) {
          setHasExistingUsers(false);
        }
      }

      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!cancelled && session) {
          router.replace("/admin");
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function handleLogin(formData: FormData) {
    if (!supabase) {
      setLoginError("Supabase n'est pas configure sur cette V2.");
      return;
    }

    setIsBusy(true);
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") || "");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setLoginError(error?.message || "Identifiants invalides.");
      setIsBusy(false);
      return;
    }

    const { data: appUser, error: appUserError } = await supabase
      .from("app_users")
      .select("id, active")
      .eq("id", data.user.id)
      .single();

    if (appUserError || !appUser || !appUser.active) {
      await supabase.auth.signOut();
      setLoginError("Compte non autorise ou desactive.");
      setIsBusy(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  async function handleRegister(formData: FormData) {
    if (!supabase) {
      setRegisterError("Supabase n'est pas configure sur cette V2.");
      return;
    }

    setIsBusy(true);
    const fullName = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") || "");

    if (!fullName || !email || password.length < 6) {
      setRegisterError(
        "Merci de remplir tous les champs avec un mot de passe d'au moins 6 caracteres.",
      );
      setIsBusy(false);
      return;
    }

    const response = await fetch("/api/admin/bootstrap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        email,
        password,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    if (!response.ok) {
      setRegisterError(payload?.message || "Impossible de creer le compte initial.");
      setIsBusy(false);
      return;
    }

    const { error: loginErrorAfterBootstrap } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginErrorAfterBootstrap) {
      setRegisterError(loginErrorAfterBootstrap.message);
      setIsBusy(false);
      return;
    }

    setHasExistingUsers(true);
    setRegisterSuccess("Compte admin principal cree. Redirection vers l'admin...");
    setTimeout(() => {
      router.push("/admin");
      router.refresh();
    }, 300);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(212,162,136,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(138,79,52,0.14),transparent_28%),#fffaf6] px-6 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[34px] border border-white/70 bg-white/88 p-8 shadow-[0_22px_55px_rgba(91,54,35,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4f34]">
            Espace prive
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-tight text-[#2d1d17]">
            Connexion admin V2
          </h1>
          <p className="mt-5 text-sm leading-7 text-[#6f5b50]">
            La partie admin reste separee du site client. L&apos;admin principal peut ensuite creer
            des comptes manager et employe depuis le dashboard.
          </p>
          <div className="mt-8 grid gap-3">
            <div className="rounded-[24px] bg-[#fff8f4] px-5 py-4 text-sm leading-6 text-[#5f4a40]">
              Compte admin principal
            </div>
            <div className="rounded-[24px] bg-[#fff8f4] px-5 py-4 text-sm leading-6 text-[#5f4a40]">
              Comptes manager / employe
            </div>
            <div className="rounded-[24px] bg-[#fff8f4] px-5 py-4 text-sm leading-6 text-[#5f4a40]">
              Admin totalement separe du site vitrine
            </div>
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full border border-[#ead6c9] bg-white px-5 py-3 text-sm font-semibold text-[#6f5b50] hover:-translate-y-0.5 hover:text-[#8a4f34]"
          >
            Retour au site client
          </Link>
          <Link
            href="/setup/supabase"
            className="mt-3 inline-flex rounded-full border border-[#ead6c9] bg-white px-5 py-3 text-sm font-semibold text-[#6f5b50] hover:-translate-y-0.5 hover:text-[#8a4f34]"
          >
            Voir le setup Supabase
          </Link>
          <p className="mt-4 text-xs leading-6 text-[#8a4f34]">
            URL interne actuelle : <span className="font-semibold">{ADMIN_LOGIN_PATH}</span>
          </p>

          <div className="mt-8">
            <SetupStatus compact />
          </div>
        </section>

        <section className="rounded-[34px] border border-white/70 bg-white/92 p-8 shadow-[0_22px_55px_rgba(91,54,35,0.12)]">
          <div className="inline-flex rounded-full bg-[#fff2e9] p-1.5">
            <button
              className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
                activeTab === "login"
                  ? "bg-[#8a4f34] text-white"
                  : "text-[#6f5b50] hover:text-[#8a4f34]"
              }`}
              onClick={() => setActiveTab("login")}
              type="button"
            >
              Connexion
            </button>
            <button
              className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
                activeTab === "register"
                  ? "bg-[#8a4f34] text-white"
                  : "text-[#6f5b50] hover:text-[#8a4f34]"
              }`}
              onClick={() => setActiveTab("register")}
              type="button"
            >
              Compte initial
            </button>
          </div>

          {activeTab === "login" ? (
            <form
              className="mt-8 grid gap-5"
              action={(formData) => {
                setLoginError("");
                void handleLogin(formData);
              }}
            >
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#2d1d17]" htmlFor="login-email">
                  Email admin
                </label>
                <input
                  className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                  id="login-email"
                  name="email"
                  type="email"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#2d1d17]" htmlFor="login-password">
                  Mot de passe
                </label>
                <div className="flex gap-3">
                  <input
                    className="min-w-0 flex-1 rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                    id="login-password"
                    name="password"
                    type={showLoginPassword ? "text" : "password"}
                    required
                  />
                  <button
                    className="shrink-0 rounded-2xl border border-[#ead6c9] bg-white px-4 py-3 text-sm font-semibold text-[#6f5b50] hover:-translate-y-0.5 hover:text-[#8a4f34]"
                    onClick={() => setShowLoginPassword((value) => !value)}
                    type="button"
                  >
                    {showLoginPassword ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </div>

              {loginError ? <p className="text-sm text-[#a63f3f]">{loginError}</p> : null}

              <button
                className="rounded-full bg-[#8a4f34] px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-[#73422b] disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isBusy || !supabase}
              >
                {isBusy ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          ) : (
            <form
              className="mt-8 grid gap-5"
              action={(formData) => {
                setRegisterError("");
                setRegisterSuccess("");
                void handleRegister(formData);
              }}
            >
              <div className="rounded-[24px] bg-[#fff8f4] px-5 py-4 text-sm leading-6 text-[#5f4a40]">
                {hasExistingUsers === null
                  ? "Verification en cours de l'existence du premier compte..."
                  : hasExistingUsers
                    ? "Le premier compte existe deja. Passe ensuite par l'admin principal pour creer les autres comptes."
                    : "Cette inscription sert uniquement a creer le premier compte admin principal."}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#2d1d17]" htmlFor="register-name">
                  Nom admin
                </label>
                <input
                  className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34] disabled:opacity-60"
                  id="register-name"
                  name="name"
                  type="text"
                  required
                  disabled={Boolean(hasExistingUsers) || isBusy || hasExistingUsers === null}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#2d1d17]" htmlFor="register-email">
                  Email admin
                </label>
                <input
                  className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34] disabled:opacity-60"
                  id="register-email"
                  name="email"
                  type="email"
                  required
                  disabled={Boolean(hasExistingUsers) || isBusy || hasExistingUsers === null}
                />
              </div>

              <div className="grid gap-2">
                <label
                  className="text-sm font-semibold text-[#2d1d17]"
                  htmlFor="register-password"
                >
                  Mot de passe
                </label>
                <div className="flex gap-3">
                  <input
                    className="min-w-0 flex-1 rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34] disabled:opacity-60"
                    id="register-password"
                    name="password"
                    type={showRegisterPassword ? "text" : "password"}
                    minLength={6}
                    required
                    disabled={Boolean(hasExistingUsers) || isBusy || hasExistingUsers === null}
                  />
                  <button
                    className="shrink-0 rounded-2xl border border-[#ead6c9] bg-white px-4 py-3 text-sm font-semibold text-[#6f5b50] hover:-translate-y-0.5 hover:text-[#8a4f34] disabled:opacity-60"
                    onClick={() => setShowRegisterPassword((value) => !value)}
                    type="button"
                    disabled={Boolean(hasExistingUsers) || isBusy || hasExistingUsers === null}
                  >
                    {showRegisterPassword ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </div>

              {registerError ? <p className="text-sm text-[#a63f3f]">{registerError}</p> : null}
              {registerSuccess ? (
                <p className="text-sm text-[#2f7d55]">{registerSuccess}</p>
              ) : null}

              <button
                className="rounded-full bg-[#8a4f34] px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-[#73422b] disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={Boolean(hasExistingUsers) || isBusy || !supabase || hasExistingUsers === null}
              >
                {isBusy ? "Creation..." : "Creer le compte admin principal"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
