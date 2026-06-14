"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { OrderCard } from "@/components/order-card";
import { SetupStatus } from "@/components/setup-status";
import {
  canManageAppUsers,
  getAppUserRoleLabel,
  type AppUserRecord,
} from "@/lib/app-users";
import {
  getStatusLabel,
  orders,
  products,
  type OrderStatus,
} from "@/lib/mock-data";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-path";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const workflowSteps = [
  "Reception d'une commande client",
  "Analyse par un admin, manager ou employe",
  "Demande d'informations complementaires si necessaire",
  "Affichage de la reponse recue par email ou SMS",
  "Validation, refus ou attente de paiement",
];

const statusLegend: OrderStatus[] = [
  "pending",
  "reviewing",
  "accepted",
  "awaiting_payment",
  "refused",
];

export default function AdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [currentUser, setCurrentUser] = useState<AppUserRecord | null>(null);
  const [sessionEmail, setSessionEmail] = useState("");
  const [users, setUsers] = useState<AppUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");

  const dashboardCards = useMemo(
    () => [
      {
        label: "Demandes en attente",
        value: orders.filter((order) => order.status === "pending").length,
      },
      {
        label: "Commandes en analyse",
        value: orders.filter((order) => order.status === "reviewing").length,
      },
      {
        label: "Complements envoyes",
        value: orders.reduce((sum, order) => sum + order.complementaryRequests.length, 0),
      },
      {
        label: "Reponses client recueillies",
        value: orders.reduce((sum, order) => sum + order.clientReplies.length, 0),
      },
    ],
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAdminSession() {
      if (!supabase) {
        router.replace(ADMIN_LOGIN_PATH);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(ADMIN_LOGIN_PATH);
        return;
      }

      const [{ data: profile, error: profileError }, { data: appUsers, error: usersError }] =
        await Promise.all([
          supabase.from("app_users").select("*").eq("id", user.id).single(),
          supabase.from("app_users").select("*").order("created_at", { ascending: true }),
        ]);

      if (
        profileError ||
        !profile ||
        !profile.active ||
        usersError ||
        !Array.isArray(appUsers)
      ) {
        await supabase.auth.signOut();
        router.replace(ADMIN_LOGIN_PATH);
        return;
      }

      if (!cancelled) {
        setCurrentUser(profile as AppUserRecord);
        setSessionEmail(user.email || "");
        setUsers(appUsers as AppUserRecord[]);
        setLoading(false);
      }
    }

    void loadAdminSession();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  if (loading || !currentUser) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf6_0%,#f8efe8_100%)]">
        <section className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-10 lg:px-10">
          <div className="rounded-[30px] border border-white/70 bg-white/88 px-8 py-6 text-sm text-[#6f5b50] shadow-[0_22px_55px_rgba(91,54,35,0.12)]">
            Verification de la session admin...
          </div>
        </section>
      </main>
    );
  }

  async function refreshUsers() {
    if (!supabase) return;

    const { data } = await supabase
      .from("app_users")
      .select("*")
      .order("created_at", { ascending: true });

    if (Array.isArray(data)) {
      setUsers(data as AppUserRecord[]);
    }
  }

  async function handleCreateUser(formData: FormData) {
    setUserError("");
    setUserSuccess("");

    if (!currentUser) {
      setUserError("Session admin introuvable.");
      return;
    }

    if (!canManageAppUsers(currentUser.role)) {
      setUserError("Seul l'admin principal peut creer ou gerer les comptes.");
      return;
    }

    const fullName = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") || "");
    const role = String(formData.get("role") || "employee") as "manager" | "employee";

    if (!fullName || !email || password.length < 6) {
      setUserError("Merci de remplir tous les champs avec un mot de passe d'au moins 6 caracteres.");
      return;
    }

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        email,
        password,
        role,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    if (!response.ok) {
      setUserError(payload?.message || "Impossible de creer le compte.");
      return;
    }

    await refreshUsers();
    setUserSuccess("Nouveau compte cree dans la V2.");
  }

  async function handleToggleUser(targetId: string) {
    if (!currentUser) return;
    if (!canManageAppUsers(currentUser.role)) return;

    const targetUser = users.find((user) => user.id === targetId);
    if (!targetUser || targetUser.id === currentUser.id) return;

    const response = await fetch(`/api/admin/users/${targetId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active: !targetUser.active,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      setUserError(payload?.message || "Impossible de modifier le compte.");
      return;
    }

    await refreshUsers();
  }

  async function handleDeleteUser(targetId: string) {
    if (!currentUser) return;
    if (!canManageAppUsers(currentUser.role)) return;

    const targetUser = users.find((user) => user.id === targetId);
    if (!targetUser || targetUser.id === currentUser.id) return;

    const confirmed = window.confirm(
      `Supprimer definitivement le compte ${targetUser.full_name} ?`,
    );
    if (!confirmed) return;

    const response = await fetch(`/api/admin/users/${targetId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      setUserError(payload?.message || "Impossible de supprimer le compte.");
      return;
    }

    await refreshUsers();
  }

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push(ADMIN_LOGIN_PATH);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf6_0%,#f8efe8_100%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="flex flex-col gap-5 rounded-[34px] border border-white/70 bg-white/88 p-7 shadow-[0_22px_55px_rgba(91,54,35,0.12)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4f34]">
              Dashboard V2
            </p>
            <h1 className="mt-3 font-serif text-5xl text-[#2d1d17]">
              Commandes, equipe et complements client
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#6f5b50]">
              Cette V2 pose deja la logique que tu as demandee : un admin, un manager ou un
              employe peut demander des informations complementaires, puis l&apos;admin voit ensuite si
              le client a repondu par email ou par SMS.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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
              Comptes admin
            </Link>
            <Link
              href="/setup/supabase"
              className="rounded-full border border-[#ead6c9] bg-[#fff8f4] px-5 py-3 text-sm font-semibold text-[#6f5b50] hover:-translate-y-0.5 hover:text-[#8a4f34]"
            >
              Setup Supabase
            </Link>
            <button
              className="rounded-full bg-[#8a4f34] px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-[#73422b]"
              onClick={handleLogout}
              type="button"
            >
              Se deconnecter
            </button>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Session active
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">{currentUser.full_name}</h2>
            <p className="mt-2 text-sm text-[#8a4f34]">{getAppUserRoleLabel(currentUser.role)}</p>
            <p className="mt-3 text-sm leading-6 text-[#6f5b50]">{sessionEmail}</p>
          </article>

          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Acces V2
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
              Admin principal, manager et employe
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6f5b50]">
              La page admin reste separee du site client. L&apos;admin principal peut creer,
              desactiver ou supprimer les comptes. Les managers et employes gardent ensuite leur
              acces au dashboard.
            </p>

            <div className="mt-6">
              <SetupStatus compact />
            </div>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map((card) => (
            <article
              key={card.label}
              className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
                {card.label}
              </p>
              <p className="mt-4 font-serif text-4xl text-[#2d1d17]">{card.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Roles
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
              Equipe visible dans la V2
            </h2>
            <div className="mt-6 grid gap-3">
              {users.map((member) => (
                <div
                  key={member.id}
                  className="rounded-[22px] border border-[#efddd2] bg-[#fffaf7] px-4 py-4"
                >
                  <p className="text-sm font-semibold text-[#2d1d17]">{member.full_name}</p>
                  <p className="mt-1 text-sm text-[#8a4f34]">
                    {getAppUserRoleLabel(member.role)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6f5b50]">
                    {member.active ? "Actif" : "Desactive"}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Workflow
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
              Logique prevue pour le vrai backend
            </h2>
            <div className="mt-6 grid gap-4">
              {workflowSteps.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-[22px] bg-[#fff8f4] p-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#8a4f34] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-[#5f4a40]">{step}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Gestion des comptes
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
              Creation manager et employe
            </h2>

            {canManageAppUsers(currentUser.role) ? (
              <form
                className="mt-6 grid gap-4"
                action={(formData) => {
                  void handleCreateUser(formData);
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                    name="name"
                    placeholder="Nom"
                    required
                    type="text"
                  />
                  <input
                    className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                    name="email"
                    placeholder="Email"
                    required
                    type="email"
                  />
                  <input
                    className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                    name="password"
                    placeholder="Mot de passe"
                    minLength={6}
                    required
                    type="password"
                  />
                  <select
                    className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                    defaultValue="employee"
                    name="role"
                  >
                    <option value="manager">Manager</option>
                    <option value="employee">Employe</option>
                  </select>
                </div>

                {userError ? <p className="text-sm text-[#a63f3f]">{userError}</p> : null}
                {userSuccess ? <p className="text-sm text-[#2f7d55]">{userSuccess}</p> : null}

                <button
                  className="w-fit rounded-full bg-[#8a4f34] px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-[#73422b]"
                  type="submit"
                >
                  Creer le compte
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-[24px] bg-[#fff8f4] px-5 py-4 text-sm leading-7 text-[#5f4a40]">
                Seul l&apos;admin principal peut creer ou gerer les comptes. Ton acces au dashboard
                reste actif selon ton role.
              </div>
            )}
          </article>

          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Comptes existants
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
              Equipe admin V2
            </h2>
            <div className="mt-6 grid gap-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-[22px] border border-[#efddd2] bg-[#fffaf7] px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#2d1d17]">{user.full_name}</p>
                      <p className="mt-1 text-sm text-[#8a4f34]">{getAppUserRoleLabel(user.role)}</p>
                      <p className="mt-2 text-sm leading-6 text-[#6f5b50]">
                        {user.active ? "Actif" : "Desactive"} · Cree le{" "}
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(user.created_at))}
                      </p>
                    </div>

                    {canManageAppUsers(currentUser.role) && user.id !== currentUser.id ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-[#ead6c9] bg-white px-4 py-2 text-sm font-semibold text-[#6f5b50] hover:-translate-y-0.5 hover:text-[#8a4f34]"
                          onClick={() => void handleToggleUser(user.id)}
                          type="button"
                        >
                          {user.active ? "Desactiver" : "Reactiver"}
                        </button>
                        <button
                          className="rounded-full border border-[#ead6c9] bg-white px-4 py-2 text-sm font-semibold text-[#a63f3f] hover:-translate-y-0.5"
                          onClick={() => void handleDeleteUser(user.id)}
                          type="button"
                        >
                          Supprimer
                        </button>
                      </div>
                    ) : (
                      <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#6f5b50]">
                        {user.id === currentUser.id ? "Compte connecte" : "Lecture seule"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
                Statuts commandes
              </p>
              <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
                Lecture rapide pour toute l&apos;equipe
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusLegend.map((status) => (
                <span
                  key={status}
                  className="rounded-full border border-[#ead6c9] bg-[#fff8f4] px-4 py-2 text-sm text-[#6f5b50]"
                >
                  {getStatusLabel(status)}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-8">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </section>

        <section className="rounded-[30px] border border-white/70 bg-[#2f201a] p-8 text-white shadow-[0_20px_55px_rgba(47,32,26,0.24)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f4cdb7]">
                Suite backend
              </p>
              <h2 className="mt-3 font-serif text-4xl">
                Ce que je brancherai ensuite sur Supabase
              </h2>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-white/80">
                <li>- Auth reelle avec roles owner, manager et employee</li>
                <li>- Vraies commandes en base</li>
                <li>- Journal d&apos;evenements par commande</li>
                <li>- Demandes de complements stockees avec canal prefere</li>
                <li>- Reponses client email ou SMS rattachees automatiquement</li>
              </ul>
            </div>
            <div className="rounded-[26px] bg-white/8 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f4cdb7]">
                Produits prets a migrer
              </p>
              <div className="mt-4 space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="rounded-2xl bg-white/8 px-4 py-3">
                    <p className="font-medium text-white">{product.name}</p>
                    <p className="mt-1 text-sm text-white/70">{product.category}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
