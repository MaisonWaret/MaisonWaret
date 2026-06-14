"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { OrderCard } from "@/components/order-card";
import { SetupStatus } from "@/components/setup-status";
import {
  canManageAppUsers,
  getAppUserRoleLabel,
  type AppUserRecord,
} from "@/lib/app-users";
import {
  ADMIN_ORDER_STATUSES,
  type AdminClientReview,
  type AdminCreateInformationRequestInput,
  formatAdminDate,
  formatAdminDateTime,
  formatAdminPrice,
  getAdminEventLabel,
  getAdminOrderStatusLabel,
  type AdminDashboardData,
  type AdminOrderRecord,
  type AdminOrderStatus,
  type AdminOrderUpdateInput,
} from "@/lib/admin-dashboard";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-path";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });
const LIVE_REFRESH_DEBOUNCE_MS = 500;
const FALLBACK_REFRESH_INTERVAL_MS = 15000;
const UNREAD_ORDERS_STORAGE_KEY = "maison-waret-admin-unread-orders";

type LiveSyncState = "connecting" | "live" | "fallback";
type OrderSortOption =
  | "newest"
  | "oldest"
  | "requested_date"
  | "highest_total"
  | "latest_update";
type AdminToast = {
  id: string;
  title: string;
  message: string;
};

type ReviewFormState = {
  orderId: string | null;
  authorName: string;
  city: string;
  title: string;
  message: string;
  occasion: string;
  rating: string;
  sortOrder: string;
  visible: boolean;
};

function createReviewDraftFromOrder(order: AdminOrderRecord): ReviewFormState {
  const firstItem = order.items[0];
  const titleBase = firstItem?.productName || "Commande Maison Waret";
  const occasionBase = firstItem?.category || (order.deliveryMode === "delivery" ? "Livraison" : "Retrait");

  return {
    orderId: order.id,
    authorName: order.customerName,
    city: "",
    title: `${titleBase} tres apprecie`,
    message:
      "Commande tres appreciee pour la qualite des produits, la presentation soignee et la fluidite de l'echange avec Maison Waret.",
    occasion: occasionBase,
    rating: "5",
    sortOrder: "0",
    visible: true,
  };
}

function createEmptyReviewFormState(): ReviewFormState {
  return {
    orderId: null,
    authorName: "",
    city: "",
    title: "",
    message: "",
    occasion: "",
    rating: "5",
    sortOrder: "0",
    visible: true,
  };
}

function createReviewFormState(review: AdminClientReview): ReviewFormState {
  return {
    orderId: review.orderId,
    authorName: review.authorName,
    city: review.city || "",
    title: review.title || "",
    message: review.message,
    occasion: review.occasion || "",
    rating: String(review.rating),
    sortOrder: String(review.sortOrder),
    visible: review.visible,
  };
}

function buildUniqueOrderIds(orderIds: string[]) {
  return Array.from(new Set(orderIds));
}

function readStoredUnreadOrderIds() {
  if (typeof window === "undefined") return [];

  try {
    const storedValue = window.localStorage.getItem(UNREAD_ORDERS_STORAGE_KEY);
    if (!storedValue) return [];

    const parsedValue = JSON.parse(storedValue) as unknown;
    if (!Array.isArray(parsedValue)) return [];

    return buildUniqueOrderIds(
      parsedValue.filter((value): value is string => typeof value === "string"),
    );
  } catch {
    window.localStorage.removeItem(UNREAD_ORDERS_STORAGE_KEY);
    return [];
  }
}

function getLiveSyncUi(state: LiveSyncState) {
  switch (state) {
    case "live":
      return {
        badge: "Synchronisation en direct active",
        detail: "Les nouvelles commandes et mises a jour remontent automatiquement.",
        className: "border-[#d5e8dc] bg-[#eef8f1] text-[#2f7d55]",
        dotClassName: "bg-[#2f7d55]",
      };
    case "fallback":
      return {
        badge: "Mode secours actif",
        detail: "Le dashboard continue de se mettre a jour automatiquement en arriere-plan.",
        className: "border-[#efddd2] bg-[#fff8f4] text-[#8a4f34]",
        dotClassName: "bg-[#8a4f34]",
      };
    default:
      return {
        badge: "Connexion en cours",
        detail: "Initialisation de la synchronisation automatique du dashboard.",
        className: "border-[#ead6c9] bg-white text-[#6f5b50]",
        dotClassName: "bg-[#d7a98d]",
      };
  }
}

function buildAnnualOverview(orders: AdminOrderRecord[]) {
  const year = new Date().getFullYear();
  const acceptedStatuses = new Set<AdminOrderStatus>([
    "accepted",
    "awaiting_payment",
    "paid",
    "in_preparation",
    "ready",
    "completed",
  ]);

  const months = Array.from({ length: 12 }, (_, index) => ({
    key: index,
    label: monthFormatter.format(new Date(year, index, 1)),
    totalOrders: 0,
    acceptedOrders: 0,
    refusedOrders: 0,
    revenue: 0,
  }));

  orders.forEach((order) => {
    const createdAt = new Date(order.createdAt);
    if (createdAt.getFullYear() !== year) return;

    const monthIndex = createdAt.getMonth();
    const month = months[monthIndex];
    month.totalOrders += 1;

    if (acceptedStatuses.has(order.status)) {
      month.acceptedOrders += 1;
    }

    if (order.status === "refused") {
      month.refusedOrders += 1;
    }

    if (order.status !== "refused" && order.status !== "cancelled") {
      month.revenue += order.finalTotal ?? order.estimatedTotal ?? 0;
    }
  });

  const totalOrders = months.reduce((sum, month) => sum + month.totalOrders, 0);
  const acceptedOrders = months.reduce((sum, month) => sum + month.acceptedOrders, 0);
  const refusedOrders = months.reduce((sum, month) => sum + month.refusedOrders, 0);
  const projectedRevenue = months.reduce((sum, month) => sum + month.revenue, 0);
  const maxOrders = Math.max(1, ...months.map((month) => month.totalOrders));

  return {
    year,
    months,
    totalOrders,
    acceptedOrders,
    refusedOrders,
    projectedRevenue,
    maxOrders,
  };
}

function getOrderDisplayTotal(order: AdminOrderRecord) {
  return order.finalTotal ?? order.estimatedTotal ?? 0;
}

function normalizeSearchValue(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function orderMatchesSearch(order: AdminOrderRecord, search: string) {
  const normalizedSearch = normalizeSearchValue(search);
  if (!normalizedSearch) return true;

  const searchableParts = [
    order.orderNumber,
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    order.deliveryAddress,
    order.pickupNotes,
    order.notes,
    order.assignedToName,
    ...order.items.map((item) => item.productName),
    ...order.items.map((item) => item.category || ""),
  ];

  return searchableParts.some((value) => normalizeSearchValue(value).includes(normalizedSearch));
}

function sortOrders(orders: AdminOrderRecord[], sort: OrderSortOption) {
  const sortedOrders = [...orders];

  sortedOrders.sort((leftOrder, rightOrder) => {
    switch (sort) {
      case "oldest":
        return leftOrder.createdAt.localeCompare(rightOrder.createdAt);
      case "requested_date":
        return leftOrder.requestedDate.localeCompare(rightOrder.requestedDate);
      case "highest_total":
        return getOrderDisplayTotal(rightOrder) - getOrderDisplayTotal(leftOrder);
      case "latest_update":
        return rightOrder.updatedAt.localeCompare(leftOrder.updatedAt);
      default:
        return rightOrder.createdAt.localeCompare(leftOrder.createdAt);
    }
  });

  return sortedOrders;
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const refreshDashboardRef = useRef<() => Promise<void>>(async () => {});
  const refreshTimeoutRef = useRef<number | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const refreshInFlightRef = useRef(false);
  const pendingRefreshRef = useRef(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const hasCompletedInitialLoadRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUserRecord | null>(null);
  const [sessionEmail, setSessionEmail] = useState("");
  const [users, setUsers] = useState<AppUserRecord[]>([]);
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [recentEvents, setRecentEvents] = useState<AdminDashboardData["recentEvents"]>([]);
  const [reviews, setReviews] = useState<AdminClientReview[]>([]);
  const [reviewsFeatureEnabled, setReviewsFeatureEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [requestOrderId, setRequestOrderId] = useState<string | null>(null);
  const [liveSyncState, setLiveSyncState] = useState<LiveSyncState>("connecting");
  const [toast, setToast] = useState<AdminToast | null>(null);
  const [unreadOrderIds, setUnreadOrderIds] = useState<string[]>(readStoredUnreadOrderIds);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatus | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [deliveryModeFilter, setDeliveryModeFilter] = useState<"all" | "delivery" | "pickup">("all");
  const [orderSort, setOrderSort] = useState<OrderSortOption>("newest");
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>(createEmptyReviewFormState);

  const activeOrders = useMemo(() => orders.filter((order) => !order.archived), [orders]);
  const archivedOrders = useMemo(() => orders.filter((order) => order.archived), [orders]);
  const existingOrderIds = useMemo(() => new Set(orders.map((order) => order.id)), [orders]);
  const effectiveUnreadOrderIds = useMemo(
    () => unreadOrderIds.filter((orderId) => existingOrderIds.has(orderId)),
    [existingOrderIds, unreadOrderIds],
  );

  const annualOverview = useMemo(() => buildAnnualOverview(orders), [orders]);
  const unreadOrders = useMemo(
    () => orders.filter((order) => effectiveUnreadOrderIds.includes(order.id)),
    [effectiveUnreadOrderIds, orders],
  );
  const waitingInformationOrders = useMemo(
    () =>
      activeOrders.filter((order) =>
        order.informationRequests.some((request) => request.status === "waiting"),
      ),
    [activeOrders],
  );
  const pendingReviewOrders = useMemo(
    () =>
      activeOrders.filter(
        (order) => order.status === "pending" || order.status === "reviewing",
      ),
    [activeOrders],
  );
  const awaitingPaymentOrders = useMemo(
    () => activeOrders.filter((order) => order.status === "awaiting_payment"),
    [activeOrders],
  );
  const readyOrders = useMemo(
    () => activeOrders.filter((order) => order.status === "ready"),
    [activeOrders],
  );
  const unassignedOrders = useMemo(
    () =>
      activeOrders.filter(
        (order) =>
          !order.assignedToUserId &&
          !["completed", "refused", "cancelled"].includes(order.status),
      ),
    [activeOrders],
  );
  const statusCounts = useMemo(
    () =>
      Object.fromEntries(
        ADMIN_ORDER_STATUSES.map((status) => [
          status,
          activeOrders.filter((order) => order.status === status).length,
        ]),
      ) as Record<AdminOrderStatus, number>,
    [activeOrders],
  );
  const reviewsByOrderId = useMemo(
    () =>
      new Map(
        reviews
          .filter((review) => review.orderId)
          .map((review) => [review.orderId as string, review] as const),
      ),
    [reviews],
  );
  const visibleActiveOrders = useMemo(
    () =>
      showUnreadOnly
        ? activeOrders.filter((order) => effectiveUnreadOrderIds.includes(order.id))
        : activeOrders,
    [activeOrders, effectiveUnreadOrderIds, showUnreadOnly],
  );
  const visibleArchivedOrders = useMemo(
    () =>
      showUnreadOnly
        ? archivedOrders.filter((order) => effectiveUnreadOrderIds.includes(order.id))
        : archivedOrders,
    [archivedOrders, effectiveUnreadOrderIds, showUnreadOnly],
  );
  const filteredActiveOrders = useMemo(() => {
    const filteredOrders = visibleActiveOrders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (deliveryModeFilter !== "all" && order.deliveryMode !== deliveryModeFilter) return false;
      if (assigneeFilter === "unassigned" && order.assignedToUserId) return false;
      if (assigneeFilter !== "all" && assigneeFilter !== "unassigned" && order.assignedToUserId !== assigneeFilter) {
        return false;
      }

      return orderMatchesSearch(order, searchQuery);
    });

    return sortOrders(filteredOrders, orderSort);
  }, [
    assigneeFilter,
    deliveryModeFilter,
    orderSort,
    searchQuery,
    statusFilter,
    visibleActiveOrders,
  ]);
  const filteredArchivedOrders = useMemo(() => {
    const filteredOrders = visibleArchivedOrders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (deliveryModeFilter !== "all" && order.deliveryMode !== deliveryModeFilter) return false;
      if (assigneeFilter === "unassigned" && order.assignedToUserId) return false;
      if (assigneeFilter !== "all" && assigneeFilter !== "unassigned" && order.assignedToUserId !== assigneeFilter) {
        return false;
      }

      return orderMatchesSearch(order, searchQuery);
    });

    return sortOrders(filteredOrders, orderSort);
  }, [
    assigneeFilter,
    deliveryModeFilter,
    orderSort,
    searchQuery,
    statusFilter,
    visibleArchivedOrders,
  ]);
  const orderAttentionGroups = useMemo(
    () => [
      {
        key: "review",
        label: "A traiter vite",
        helper: "Commandes encore en attente de validation ou d'analyse.",
        tone: "border-[#ead6c9] bg-[#fff8f4] text-[#8a4f34]",
        orders: sortOrders(pendingReviewOrders, "requested_date").slice(0, 4),
      },
      {
        key: "payment",
        label: "Paiement a relancer",
        helper: "Commandes acceptees mais encore en attente de paiement.",
        tone: "border-[#efe0bf] bg-[#fff9ed] text-[#8b6822]",
        orders: sortOrders(awaitingPaymentOrders, "latest_update").slice(0, 4),
      },
      {
        key: "infos",
        label: "Infos client en attente",
        helper: "Des complements ont ete demandes et attendent un retour client.",
        tone: "border-[#d8def2] bg-[#f6f7ff] text-[#4f5ca8]",
        orders: sortOrders(waitingInformationOrders, "latest_update").slice(0, 4),
      },
    ],
    [awaitingPaymentOrders, pendingReviewOrders, waitingInformationOrders],
  );
  const ownerAssignmentInsights = useMemo(() => {
    const activeTeamMembers = users.filter((user) => user.active);

    return activeTeamMembers
      .map((user) => ({
        id: user.id,
        fullName: user.full_name,
        roleLabel: getAppUserRoleLabel(user.role),
        assignedOrders: activeOrders.filter((order) => order.assignedToUserId === user.id).length,
      }))
      .filter((user) => user.assignedOrders > 0)
      .sort((leftUser, rightUser) => rightUser.assignedOrders - leftUser.assignedOrders)
      .slice(0, 4);
  }, [activeOrders, users]);

  const dashboardCards = useMemo(() => {
    const waitingInformationRequests = orders.reduce(
      (sum, order) =>
        sum + order.informationRequests.filter((request) => request.status === "waiting").length,
      0,
    );
    const clientReplies = orders.reduce(
      (sum, order) =>
        sum +
        order.informationRequests.reduce(
          (requestSum, request) => requestSum + request.replies.length,
          0,
        ),
      0,
    );

    return [
      {
        label: "Commandes actives",
        value: activeOrders.length,
      },
      {
        label: "A valider",
        value: pendingReviewOrders.length,
      },
      {
        label: "Paiement en attente",
        value: awaitingPaymentOrders.length,
      },
      {
        label: "Complements ouverts",
        value: waitingInformationRequests,
      },
      {
        label: "Reponses client",
        value: clientReplies,
      },
      {
        label: "Non assignees",
        value: unassignedOrders.length,
      },
    ];
  }, [activeOrders.length, awaitingPaymentOrders.length, orders, pendingReviewOrders.length, unassignedOrders.length]);

  const liveSyncUi = useMemo(() => getLiveSyncUi(liveSyncState), [liveSyncState]);

  const playNewOrderSound = useCallback(() => {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = audioContextRef.current || new AudioContextClass();
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      void audioContext.resume().catch(() => {});
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const startTime = audioContext.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(987, startTime + 0.18);

    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.05, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.34);
  }, []);

  const refreshDashboard = useCallback(async () => {
    if (refreshInFlightRef.current) {
      pendingRefreshRef.current = true;
      return;
    }

    refreshInFlightRef.current = true;
    try {
      const response = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | (AdminDashboardData & { message?: string })
        | null;

      if (!response.ok || !payload) {
        if (response.status === 401 || response.status === 403) {
          if (supabase) {
            await supabase.auth.signOut();
          }
          router.replace(ADMIN_LOGIN_PATH);
          return;
        }

        setUserError(payload?.message || "Impossible de charger le dashboard admin.");
        setLoading(false);
        return;
      }

      setUserError("");
      const nextKnownOrderIds = new Set(payload.orders.map((order) => order.id));

      if (hasCompletedInitialLoadRef.current) {
        const newOrders = payload.orders.filter((order) => !knownOrderIdsRef.current.has(order.id));

        if (newOrders.length > 0) {
          const latestOrder = [...newOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
          setUnreadOrderIds((currentIds) =>
            buildUniqueOrderIds([...newOrders.map((order) => order.id), ...currentIds]),
          );
          setToast({
            id: `${latestOrder.id}-${latestOrder.createdAt}`,
            title:
              newOrders.length > 1
                ? `${newOrders.length} nouvelles commandes recues`
                : "Nouvelle commande recue",
            message:
              newOrders.length > 1
                ? `La plus recente est ${latestOrder.orderNumber} pour ${latestOrder.customerName}.`
                : `${latestOrder.orderNumber} pour ${latestOrder.customerName} vient d'arriver dans l'admin.`,
          });
          playNewOrderSound();
        }
      }

      knownOrderIdsRef.current = nextKnownOrderIds;
      hasCompletedInitialLoadRef.current = true;
      setCurrentUser(payload.currentUser);
      setSessionEmail(payload.sessionEmail);
      setUsers(payload.users);
      setOrders(payload.orders);
      setRecentEvents(payload.recentEvents);
      setReviews(payload.reviews);
      setReviewsFeatureEnabled(payload.reviewsFeatureEnabled);
      setLoading(false);
    } finally {
      refreshInFlightRef.current = false;

      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        window.setTimeout(() => {
          void refreshDashboardRef.current();
        }, LIVE_REFRESH_DEBOUNCE_MS);
      }
    }
  }, [playNewOrderSound, router, supabase]);

  const scheduleDashboardRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      void refreshDashboard();
    }, LIVE_REFRESH_DEBOUNCE_MS);
  }, [refreshDashboard]);

  useEffect(() => {
    refreshDashboardRef.current = refreshDashboard;
  }, [refreshDashboard]);

  useEffect(() => {
    window.localStorage.setItem(
      UNREAD_ORDERS_STORAGE_KEY,
      JSON.stringify(effectiveUnreadOrderIds),
    );
  }, [effectiveUnreadOrderIds]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast((currentToast) => (currentToast?.id === toast.id ? null : currentToast));
    }, 5000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast]);

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

      if (!cancelled) {
        await refreshDashboard();
      }
    }

    void loadAdminSession();

    return () => {
      cancelled = true;
    };
  }, [refreshDashboard, router, supabase]);

  useEffect(() => {
    if (!supabase || !currentUser) return;

    const liveChannel = supabase.channel(`admin-live-dashboard-${currentUser.id}`);
    const tablesToWatch = [
      "orders",
      "order_items",
      "order_information_requests",
      "order_information_replies",
      "order_events",
      "notification_logs",
      "app_users",
    ] as const;

    const watchedTables = reviewsFeatureEnabled
      ? [...tablesToWatch, "customer_reviews"]
      : tablesToWatch;

    watchedTables.forEach((table) => {
      liveChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        () => {
          scheduleDashboardRefresh();
        },
      );
    });

    liveChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setLiveSyncState("live");
        return;
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        setLiveSyncState("fallback");
      }
    });

    const fallbackInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshDashboard();
      }
    }, FALLBACK_REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshDashboard();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      window.clearInterval(fallbackInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      setLiveSyncState("connecting");
      void supabase.removeChannel(liveChannel);
    };
  }, [currentUser, refreshDashboard, reviewsFeatureEnabled, scheduleDashboardRefresh, supabase]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
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

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf6_0%,#f8efe8_100%)]">
        <section className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-10 lg:px-10">
          <div className="max-w-xl rounded-[30px] border border-white/70 bg-white/88 p-8 text-sm text-[#6f5b50] shadow-[0_22px_55px_rgba(91,54,35,0.12)]">
            <h1 className="font-serif text-3xl text-[#2d1d17]">Session admin indisponible</h1>
            <p className="mt-4 leading-7">
              {userError ||
                "La session n'a pas pu etre rechargee. Reconnecte-toi a l'espace admin pour reprendre la gestion."}
            </p>
            <Link
              href={ADMIN_LOGIN_PATH}
              className="mt-6 inline-flex rounded-full bg-[#8a4f34] px-5 py-3 font-semibold text-white"
            >
              Retour a la connexion admin
            </Link>
          </div>
        </section>
      </main>
    );
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

    await refreshDashboard();
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

    await refreshDashboard();
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

    await refreshDashboard();
  }

  async function handleDeleteReview(reviewId: string) {
    if (!currentUser) return;
    if (!canManageAppUsers(currentUser.role)) return;

    const targetReview = reviews.find((review) => review.id === reviewId);
    if (!targetReview) return;

    const confirmed = window.confirm(
      `Supprimer definitivement l'avis de ${targetReview.authorName} ?`,
    );
    if (!confirmed) return;

    setDeletingReviewId(reviewId);
    setUserError("");
    setUserSuccess("");

    const response = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      setDeletingReviewId(null);
      setUserError(payload?.message || "Impossible de supprimer l'avis client.");
      return;
    }

    await refreshDashboard();
    setDeletingReviewId(null);
    setUserSuccess(payload?.message || "Avis client supprime.");
  }

  function handleReviewFormChange<K extends keyof ReviewFormState>(
    key: K,
    value: ReviewFormState[K],
  ) {
    setReviewForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleStartReviewEdit(review: AdminClientReview) {
    setEditingReviewId(review.id);
    setReviewForm(createReviewFormState(review));
    setUserError("");
    setUserSuccess("");
  }

  function handleCancelReviewEdit() {
    setEditingReviewId(null);
    setReviewForm(createEmptyReviewFormState());
  }

  function handlePrepareReviewFromOrder(order: AdminOrderRecord) {
    const linkedReview = reviewsByOrderId.get(order.id);

    if (linkedReview) {
      setEditingReviewId(linkedReview.id);
      setReviewForm(createReviewFormState(linkedReview));
      setUserError("");
      setUserSuccess(`Avis deja lie a ${order.orderNumber}, ouverture en modification.`);
    } else {
      setEditingReviewId(null);
      setReviewForm(createReviewDraftFromOrder(order));
      setUserError("");
      setUserSuccess(`Formulaire d'avis pre-rempli a partir de ${order.orderNumber}.`);
    }

    window.setTimeout(() => {
      const reviewSection = document.getElementById("admin-review-form");
      if (!reviewSection) return;

      reviewSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  async function handleCreateReview() {
    if (!currentUser || !canManageAppUsers(currentUser.role) || !reviewsFeatureEnabled) return;

    setReviewSaving(true);
    setUserError("");
    setUserSuccess("");

    const response = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: reviewForm.orderId,
        authorName: reviewForm.authorName,
        city: reviewForm.city,
        title: reviewForm.title,
        message: reviewForm.message,
        occasion: reviewForm.occasion,
        rating: reviewForm.rating,
        sortOrder: reviewForm.sortOrder,
        visible: reviewForm.visible,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      setReviewSaving(false);
      setUserError(payload?.message || "Impossible de creer l'avis client.");
      return;
    }

    await refreshDashboard();
    setReviewSaving(false);
    setReviewForm(createEmptyReviewFormState());
    setUserSuccess(payload?.message || "Avis client ajoute.");
  }

  async function handleUpdateReview(reviewId: string, overrides?: Partial<ReviewFormState>) {
    if (!currentUser || !canManageAppUsers(currentUser.role) || !reviewsFeatureEnabled) return;

    const nextReviewForm = {
      ...reviewForm,
      ...overrides,
    };

    setReviewSaving(true);
    setUserError("");
    setUserSuccess("");

    const response = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: nextReviewForm.orderId,
        authorName: nextReviewForm.authorName,
        city: nextReviewForm.city,
        title: nextReviewForm.title,
        message: nextReviewForm.message,
        occasion: nextReviewForm.occasion,
        rating: nextReviewForm.rating,
        sortOrder: nextReviewForm.sortOrder,
        visible: nextReviewForm.visible,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      setReviewSaving(false);
      setUserError(payload?.message || "Impossible de mettre a jour l'avis client.");
      return;
    }

    await refreshDashboard();
    setReviewSaving(false);
    setEditingReviewId(null);
    setReviewForm(createEmptyReviewFormState());
    setUserSuccess(payload?.message || "Avis client mis a jour.");
  }

  async function handleToggleReviewVisibility(review: AdminClientReview) {
    await handleUpdateReview(review.id, {
      authorName: review.authorName,
      orderId: review.orderId,
      city: review.city || "",
      title: review.title || "",
      message: review.message,
      occasion: review.occasion || "",
      rating: String(review.rating),
      sortOrder: String(review.sortOrder),
      visible: !review.visible,
    });
  }

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push(ADMIN_LOGIN_PATH);
  }

  async function handleUpdateOrder(orderId: string, payload: AdminOrderUpdateInput) {
    setUserError("");
    setUserSuccess("");
    setSavingOrderId(orderId);

    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json().catch(() => null)) as
      | { message?: string; noChange?: boolean }
      | null;

    if (!response.ok) {
      setUserError(result?.message || "Impossible de mettre a jour la commande.");
      setSavingOrderId(null);
      return;
    }

    await refreshDashboard();
    setSavingOrderId(null);
    setUserSuccess(
      result?.noChange
        ? "Aucune modification a enregistrer sur cette commande."
        : result?.message || "Commande mise a jour.",
    );
  }

  async function handleCreateInformationRequest(
    orderId: string,
    payload: AdminCreateInformationRequestInput,
  ) {
    setUserError("");
    setUserSuccess("");
    setRequestOrderId(orderId);

    const response = await fetch(`/api/admin/orders/${orderId}/information-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      setUserError(result?.message || "Impossible de creer la demande de complement.");
      setRequestOrderId(null);
      return;
    }

    await refreshDashboard();
    setRequestOrderId(null);
    setUserSuccess(result?.message || "Demande de complement envoyee.");
  }

  function handleMarkAllUnreadOrdersAsRead() {
    setUnreadOrderIds([]);
  }

  function handleMarkOrderAsRead(orderId: string) {
    setUnreadOrderIds((currentIds) => currentIds.filter((currentId) => currentId !== orderId));
  }

  function handleFocusOrder(orderId: string) {
    setShowUnreadOnly(false);
    setHighlightedOrderId(orderId);

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedOrderId((currentId) => (currentId === orderId ? null : currentId));
      highlightTimeoutRef.current = null;
    }, 2200);

    window.setTimeout(() => {
      const orderElement = document.getElementById(`order-card-${orderId}`);
      if (!orderElement) return;

      orderElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf6_0%,#f8efe8_100%)]">
      {toast ? (
        <div className="pointer-events-none fixed right-5 top-5 z-50 max-w-sm">
          <div className="pointer-events-auto rounded-[24px] border border-[#d5e8dc] bg-white/95 p-4 shadow-[0_18px_45px_rgba(91,54,35,0.18)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2f7d55]">
                  {toast.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#4a3830]">{toast.message}</p>
              </div>
              <button
                className="rounded-full border border-[#d5e8dc] px-3 py-1 text-xs font-semibold text-[#2f7d55]"
                onClick={() => setToast(null)}
                type="button"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="flex flex-col gap-5 rounded-[34px] border border-white/70 bg-white/88 p-7 shadow-[0_22px_55px_rgba(91,54,35,0.12)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4f34]">
              Dashboard V2
            </p>
            <h1 className="mt-3 font-serif text-5xl text-[#2d1d17]">
              Pilotage reel des commandes Maison Waret
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#6f5b50]">
              L&apos;admin principal, le manager et l&apos;employe retrouvent ici les vraies commandes
              envoyees depuis la vitrine, leur suivi, les complements client et la lecture globale du
              site sur l&apos;annee.
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
              Back-office relie a Supabase
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6f5b50]">
              La page admin reste separee du site client. L&apos;admin principal peut gerer les comptes
              et toute l&apos;equipe suit maintenant les vraies commandes, les statuts et l&apos;historique
              recent.
            </p>

            <div className="mt-6">
              <SetupStatus compact />
            </div>
          </article>
        </section>

        <section
          className={`rounded-[24px] border px-5 py-4 shadow-[0_18px_45px_rgba(91,54,35,0.08)] ${liveSyncUi.className}`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${liveSyncUi.dotClassName}`} />
              <p className="text-sm font-semibold uppercase tracking-[0.16em]">
                {liveSyncUi.badge}
              </p>
            </div>
            <p className="text-sm leading-6">{liveSyncUi.detail}</p>
          </div>
        </section>

        {unreadOrders.length > 0 ? (
          <section className="rounded-[30px] border border-[#d5e8dc] bg-[#eef8f1] p-6 shadow-[0_18px_45px_rgba(91,54,35,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f7d55]">
                  Nouvelles commandes non lues
                </p>
                <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
                  {unreadOrders.length} commande{unreadOrders.length > 1 ? "s" : ""} a consulter
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#4a3830]">
                  Ce bloc te permet de reperer tout de suite les nouvelles demandes qui viennent
                  d&apos;arriver.
                </p>
              </div>
              <button
                className="rounded-full border border-[#b8dac7] bg-white px-5 py-3 text-sm font-semibold text-[#2f7d55] hover:-translate-y-0.5"
                onClick={handleMarkAllUnreadOrdersAsRead}
                type="button"
              >
                Tout marquer comme lu
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {unreadOrders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-[22px] border border-[#cfe3d7] bg-white px-4 py-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#2d1d17]">
                        {order.orderNumber} · {order.customerName}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#5f4a40]">
                        {formatAdminDateTime(order.createdAt)} · {getAdminOrderStatusLabel(order.status)} ·{" "}
                        {formatAdminPrice(order.estimatedTotal)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-full border border-[#b8dac7] bg-white px-4 py-2 text-sm font-semibold text-[#2f7d55] hover:-translate-y-0.5"
                        onClick={() => handleFocusOrder(order.id)}
                        type="button"
                      >
                        Aller a la commande
                      </button>
                      <button
                        className="rounded-full border border-[#b8dac7] bg-white px-4 py-2 text-sm font-semibold text-[#2f7d55] hover:-translate-y-0.5"
                        onClick={() => handleMarkOrderAsRead(order.id)}
                        type="button"
                      >
                        Marquer comme lue
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.08)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
                Pilotage commandes
              </p>
              <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
                Recherche, tri et vue rapide pour l&apos;equipe
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#5f4a40]">
                Ce bloc permet d&apos;aller tout de suite sur une commande, de filtrer par statut,
                assignation ou mode, puis d&apos;ordonner l&apos;affichage selon ce qui est le plus utile
                pour l&apos;admin et l&apos;admin principal.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className={`rounded-full border px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                  showUnreadOnly
                    ? "border-[#2f7d55] bg-[#eef8f1] text-[#2f7d55]"
                    : "border-[#ead6c9] bg-[#fff8f4] text-[#6f5b50]"
                }`}
                onClick={() => setShowUnreadOnly((value) => !value)}
                type="button"
              >
                {showUnreadOnly ? "Afficher toutes les commandes" : "Afficher seulement les non lues"}
              </button>
              <button
                className="rounded-full border border-[#ead6c9] bg-white px-5 py-3 text-sm font-semibold text-[#6f5b50] transition hover:-translate-y-0.5 hover:text-[#8a4f34]"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setAssigneeFilter("all");
                  setDeliveryModeFilter("all");
                  setOrderSort("newest");
                  setShowUnreadOnly(false);
                }}
                type="button"
              >
                Reinitialiser les filtres
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))]">
            <label className="grid gap-2 text-sm text-[#5f4a40]">
              <span className="font-medium text-[#31231d]">Recherche</span>
              <input
                className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Client, numero, telephone, produit..."
                type="text"
                value={searchQuery}
              />
            </label>

            <label className="grid gap-2 text-sm text-[#5f4a40]">
              <span className="font-medium text-[#31231d]">Statut</span>
              <select
                className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                onChange={(event) => setStatusFilter(event.target.value as AdminOrderStatus | "all")}
                value={statusFilter}
              >
                <option value="all">Tous les statuts</option>
                {ADMIN_ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {getAdminOrderStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-[#5f4a40]">
              <span className="font-medium text-[#31231d]">Assignation</span>
              <select
                className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                onChange={(event) => setAssigneeFilter(event.target.value)}
                value={assigneeFilter}
              >
                <option value="all">Toute l&apos;equipe</option>
                <option value="unassigned">Non assignees</option>
                {users
                  .filter((user) => user.active)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-[#5f4a40]">
              <span className="font-medium text-[#31231d]">Mode</span>
              <select
                className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                onChange={(event) =>
                  setDeliveryModeFilter(event.target.value as "all" | "delivery" | "pickup")
                }
                value={deliveryModeFilter}
              >
                <option value="all">Tous les modes</option>
                <option value="delivery">Livraison</option>
                <option value="pickup">Retrait</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-[#5f4a40]">
              <span className="font-medium text-[#31231d]">Tri</span>
              <select
                className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                onChange={(event) => setOrderSort(event.target.value as OrderSortOption)}
                value={orderSort}
              >
                <option value="newest">Plus recentes d&apos;abord</option>
                <option value="latest_update">Dernieres maj</option>
                <option value="requested_date">Date demandee</option>
                <option value="highest_total">Montant le plus eleve</option>
                <option value="oldest">Plus anciennes d&apos;abord</option>
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-[#fff8f4] px-4 py-2 text-sm font-semibold text-[#6f5b50]">
              {filteredActiveOrders.length} commande{filteredActiveOrders.length > 1 ? "s" : ""} active
              {filteredActiveOrders.length > 1 ? "s" : ""} visible{filteredActiveOrders.length > 1 ? "s" : ""}
            </span>
            <span className="rounded-full bg-[#fff8f4] px-4 py-2 text-sm font-semibold text-[#6f5b50]">
              {filteredArchivedOrders.length} archive{filteredArchivedOrders.length > 1 ? "s" : ""} visible
              {filteredArchivedOrders.length > 1 ? "s" : ""}
            </span>
            {searchQuery ? (
              <span className="rounded-full bg-[#eef8f1] px-4 py-2 text-sm font-semibold text-[#2f7d55]">
                Recherche active: {searchQuery}
              </span>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                statusFilter === "all"
                  ? "border-[#8a4f34] bg-[#8a4f34] text-white"
                  : "border-[#ead6c9] bg-[#fff8f4] text-[#6f5b50]"
              }`}
              onClick={() => setStatusFilter("all")}
              type="button"
            >
              Tous ({activeOrders.length})
            </button>
            {ADMIN_ORDER_STATUSES.map((status) => (
              <button
                key={status}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  statusFilter === status
                    ? "border-[#8a4f34] bg-[#8a4f34] text-white"
                    : "border-[#ead6c9] bg-[#fff8f4] text-[#6f5b50]"
                }`}
                onClick={() => setStatusFilter(status)}
                type="button"
              >
                {getAdminOrderStatusLabel(status)} ({statusCounts[status]})
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Vue prioritaire
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
              Les commandes qui demandent une action rapide
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6f5b50]">
              Cette vue remonte tout de suite les dossiers qui doivent etre traites rapidement
              sans obliger a parcourir tout le dashboard.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {orderAttentionGroups.map((group) => (
                <div
                  key={group.key}
                  className={`rounded-[24px] border p-5 ${group.tone}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                    {group.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 opacity-90">{group.helper}</p>
                  <div className="mt-4 grid gap-3">
                    {group.orders.length === 0 ? (
                      <div className="rounded-[18px] border border-current/20 bg-white/70 px-4 py-4 text-sm">
                        Rien d&apos;urgent ici pour le moment.
                      </div>
                    ) : null}
                    {group.orders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-[18px] border border-current/15 bg-white/80 px-4 py-4"
                      >
                        <p className="text-sm font-semibold text-[#2d1d17]">
                          {order.orderNumber} · {order.customerName}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#5f4a40]">
                          {getAdminOrderStatusLabel(order.status)} · {formatAdminDate(order.requestedDate)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className="rounded-full border border-current/20 bg-white px-4 py-2 text-xs font-semibold"
                            onClick={() => handleFocusOrder(order.id)}
                            type="button"
                          >
                            Ouvrir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Execution equipe
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
              Pretes, non assignees et charge visible
            </h2>

            <div className="mt-6 grid gap-4">
              <div className="rounded-[22px] border border-[#efddd2] bg-[#fffaf7] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a4f34]">
                  Commandes pretes
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6f5b50]">
                  {readyOrders.length} commande{readyOrders.length > 1 ? "s" : ""} en statut prete.
                </p>
                <div className="mt-4 grid gap-3">
                  {readyOrders.slice(0, 4).map((order) => (
                    <button
                      key={order.id}
                      className="rounded-[18px] border border-[#ead6c9] bg-white px-4 py-3 text-left transition hover:-translate-y-0.5"
                      onClick={() => handleFocusOrder(order.id)}
                      type="button"
                    >
                      <p className="text-sm font-semibold text-[#2d1d17]">
                        {order.orderNumber} · {order.customerName}
                      </p>
                      <p className="mt-1 text-sm text-[#6f5b50]">
                        {formatAdminPrice(order.finalTotal ?? order.estimatedTotal)}
                      </p>
                    </button>
                  ))}
                  {readyOrders.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#dcc3b5] px-4 py-4 text-sm text-[#8f786c]">
                      Aucune commande prete actuellement.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[22px] border border-[#efddd2] bg-[#fffaf7] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a4f34]">
                  Repartition visible
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-[18px] bg-white px-4 py-4">
                    <p className="text-sm font-semibold text-[#2d1d17]">
                      {unassignedOrders.length} commande{unassignedOrders.length > 1 ? "s" : ""} non assignee
                      {unassignedOrders.length > 1 ? "s" : ""}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#6f5b50]">
                      Ideal pour l&apos;admin principal si tu veux redistribuer rapidement la charge.
                    </p>
                  </div>

                  {canManageAppUsers(currentUser.role) ? (
                    ownerAssignmentInsights.length > 0 ? (
                      ownerAssignmentInsights.map((member) => (
                        <div key={member.id} className="rounded-[18px] bg-white px-4 py-4">
                          <p className="text-sm font-semibold text-[#2d1d17]">{member.fullName}</p>
                          <p className="mt-1 text-sm text-[#8a4f34]">{member.roleLabel}</p>
                          <p className="mt-2 text-sm leading-6 text-[#6f5b50]">
                            {member.assignedOrders} commande{member.assignedOrders > 1 ? "s" : ""} assignee
                            {member.assignedOrders > 1 ? "es" : "e"} actuellement.
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[18px] border border-dashed border-[#dcc3b5] px-4 py-4 text-sm text-[#8f786c]">
                        Aucune charge assignee a l&apos;equipe pour le moment.
                      </div>
                    )
                  ) : (
                    <div className="rounded-[18px] bg-white px-4 py-4 text-sm leading-6 text-[#6f5b50]">
                      La lecture de la charge equipe detaillee reste surtout utile a l&apos;admin principal.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Pilotage annuel
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
              Vue d&apos;ensemble {annualOverview.year}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6f5b50]">
              Ce bloc donne une lecture rapide du rythme des commandes sur l&apos;annee, du taux
              d&apos;acceptation et du chiffre estime a suivre.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-[#efddd2] bg-[#fffaf7] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a4f34]">
                  Commandes
                </p>
                <p className="mt-3 font-serif text-3xl text-[#2d1d17]">
                  {annualOverview.totalOrders}
                </p>
              </div>
              <div className="rounded-[22px] border border-[#efddd2] bg-[#fffaf7] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a4f34]">
                  Acceptees
                </p>
                <p className="mt-3 font-serif text-3xl text-[#2d1d17]">
                  {annualOverview.acceptedOrders}
                </p>
              </div>
              <div className="rounded-[22px] border border-[#efddd2] bg-[#fffaf7] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a4f34]">
                  CA estime
                </p>
                <p className="mt-3 font-serif text-3xl text-[#2d1d17]">
                  {formatAdminPrice(Number(annualOverview.projectedRevenue.toFixed(2)))}
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
              {annualOverview.months.map((month) => (
                <div
                  key={month.key}
                  className="rounded-[22px] border border-[#efddd2] bg-[#fffaf7] px-3 py-4"
                >
                  <div className="flex h-28 items-end">
                    <div
                      className="w-full rounded-full bg-[linear-gradient(180deg,#d7a98d_0%,#8a4f34_100%)]"
                      style={{
                        height: `${Math.max(
                          10,
                          Math.round((month.totalOrders / annualOverview.maxOrders) * 100),
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#8a4f34]">
                    {month.label}
                  </p>
                  <p className="mt-2 text-sm text-[#5f4a40]">{month.totalOrders} commandes</p>
                  <p className="mt-1 text-xs text-[#8f786c]">
                    {month.acceptedOrders} acceptees · {month.refusedOrders} refusees
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Activite recente
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
              Historique visible par l&apos;admin principal
            </h2>
            <div className="mt-6 grid gap-4">
              {recentEvents.length === 0 ? (
                <div className="rounded-[22px] bg-[#fff8f4] p-4 text-sm leading-6 text-[#5f4a40]">
                  Aucun evenement recent a afficher pour le moment.
                </div>
              ) : null}
              {recentEvents.map((event) => (
                <div key={event.id} className="rounded-[22px] bg-[#fff8f4] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a4f34]">
                      {getAdminEventLabel(event.eventType)}
                    </span>
                    <span className="text-xs text-[#8f786c]">
                      {formatAdminDateTime(event.createdAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#2d1d17]">
                    {event.orderNumber} · {event.customerName}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#5f4a40]">
                    {event.notes || "Mise a jour enregistree sur la commande."}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#8f786c]">
                    {event.actorName || "Systeme"}
                  </p>
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

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <div id="admin-review-form" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Avis clients
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
              Gestion premium de la vitrine
            </h2>
            {reviewsFeatureEnabled ? (
              canManageAppUsers(currentUser.role) ? (
                <div className="mt-6 grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                      onChange={(event) => handleReviewFormChange("authorName", event.target.value)}
                      placeholder="Nom du client"
                      type="text"
                      value={reviewForm.authorName}
                    />
                    <input
                      className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                      onChange={(event) => handleReviewFormChange("city", event.target.value)}
                      placeholder="Ville"
                      type="text"
                      value={reviewForm.city}
                    />
                    <input
                      className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34] md:col-span-2"
                      onChange={(event) => handleReviewFormChange("title", event.target.value)}
                      placeholder="Titre de l'avis"
                      type="text"
                      value={reviewForm.title}
                    />
                    <input
                      className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                      onChange={(event) => handleReviewFormChange("occasion", event.target.value)}
                      placeholder="Occasion"
                      type="text"
                      value={reviewForm.occasion}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                        max="5"
                        min="1"
                        onChange={(event) => handleReviewFormChange("rating", event.target.value)}
                        placeholder="Note"
                        type="number"
                        value={reviewForm.rating}
                      />
                      <input
                        className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                        min="0"
                        onChange={(event) => handleReviewFormChange("sortOrder", event.target.value)}
                        placeholder="Ordre"
                        type="number"
                        value={reviewForm.sortOrder}
                      />
                    </div>
                  </div>

                  <textarea
                    className="min-h-[140px] rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                    onChange={(event) => handleReviewFormChange("message", event.target.value)}
                    placeholder="Message visible sur la vitrine"
                    value={reviewForm.message}
                  />

                  <label className="flex items-center gap-3 text-sm text-[#6f5b50]">
                    <input
                      checked={reviewForm.visible}
                      onChange={(event) => handleReviewFormChange("visible", event.target.checked)}
                      type="checkbox"
                    />
                    Avis visible sur la vitrine
                  </label>

                  {reviewForm.orderId ? (
                    <p className="text-sm text-[#8a4f34]">
                      Avis lie a une commande client existante.
                    </p>
                  ) : (
                    <p className="text-sm text-[#8f786c]">
                      Avis libre non rattache a une commande precise.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {editingReviewId ? (
                      <>
                        <button
                          className="rounded-full bg-[#8a4f34] px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-[#73422b] disabled:opacity-60"
                          disabled={reviewSaving}
                          onClick={() => void handleUpdateReview(editingReviewId)}
                          type="button"
                        >
                          {reviewSaving ? "Enregistrement..." : "Mettre a jour l'avis"}
                        </button>
                        <button
                          className="rounded-full border border-[#ead6c9] bg-white px-5 py-3 text-sm font-semibold text-[#6f5b50] hover:-translate-y-0.5"
                          onClick={handleCancelReviewEdit}
                          type="button"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button
                        className="rounded-full bg-[#8a4f34] px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-[#73422b] disabled:opacity-60"
                        disabled={reviewSaving}
                        onClick={() => void handleCreateReview()}
                        type="button"
                      >
                        {reviewSaving ? "Ajout..." : "Ajouter un avis"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-[#6f5b50]">
                  Les avis affiches sur la home peuvent etre suivis ici. Seul l&apos;admin principal
                  peut les creer, modifier, masquer ou supprimer.
                </p>
              )
            ) : (
              <div className="mt-6 rounded-[24px] bg-[#fff8f4] px-5 py-4 text-sm leading-7 text-[#5f4a40]">
                La vitrine utilise encore le fallback d&apos;avis. Des que la table
                `customer_reviews` est activee dans Supabase, l&apos;admin principal pourra supprimer
                les avis directement depuis ce bloc.
              </div>
            )}
          </article>

          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Messages visibles
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
              Avis actuellement geres
            </h2>
            <div className="mt-6 grid gap-3">
              {!reviewsFeatureEnabled ? (
                <div className="rounded-[22px] border border-[#efddd2] bg-[#fffaf7] px-4 py-4 text-sm leading-7 text-[#6f5b50]">
                  La suppression owner-only est prete cote code, mais la table SQL doit etre ajoutee
                  pour activer la gestion reelle.
                </div>
              ) : null}

              {reviewsFeatureEnabled && reviews.length === 0 ? (
                <div className="rounded-[22px] border border-[#efddd2] bg-[#fffaf7] px-4 py-4 text-sm leading-7 text-[#6f5b50]">
                  Aucun avis client en base pour le moment.
                </div>
              ) : null}

              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-[22px] border border-[#efddd2] bg-[#fffaf7] px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#2d1d17]">
                        {review.authorName}
                        {review.city ? ` · ${review.city}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-[#8a4f34]">
                        {(review.title || "Avis client") + " · " + review.rating + "/5"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#6f5b50]">
                        {review.message}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#8f786c]">
                        {review.occasion || "Vitrine"} · {formatAdminDateTime(review.createdAt)}
                      </p>
                      {review.orderId ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f7d55]">
                          Avis deja lie a une commande
                        </p>
                      ) : null}
                    </div>

                    {canManageAppUsers(currentUser.role) && reviewsFeatureEnabled ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-[#ead6c9] bg-white px-4 py-2 text-sm font-semibold text-[#6f5b50] hover:-translate-y-0.5"
                          onClick={() => handleStartReviewEdit(review)}
                          type="button"
                        >
                          Modifier
                        </button>
                        <button
                          className="rounded-full border border-[#ead6c9] bg-white px-4 py-2 text-sm font-semibold text-[#8a4f34] hover:-translate-y-0.5 disabled:opacity-60"
                          disabled={reviewSaving}
                          onClick={() => void handleToggleReviewVisibility(review)}
                          type="button"
                        >
                          {review.visible ? "Masquer" : "Afficher"}
                        </button>
                        <button
                          className="rounded-full border border-[#ead6c9] bg-white px-4 py-2 text-sm font-semibold text-[#a63f3f] hover:-translate-y-0.5 disabled:opacity-60"
                          disabled={deletingReviewId === review.id}
                          onClick={() => void handleDeleteReview(review.id)}
                          type="button"
                        >
                          {deletingReviewId === review.id ? "Suppression..." : "Supprimer"}
                        </button>
                      </div>
                    ) : (
                      <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#6f5b50]">
                        {canManageAppUsers(currentUser.role) ? "Table requise" : "Lecture seule"}
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
              {ADMIN_ORDER_STATUSES.map((status) => (
                <span
                  key={status}
                  className="rounded-full border border-[#ead6c9] bg-[#fff8f4] px-4 py-2 text-sm text-[#6f5b50]"
                >
                  {getAdminOrderStatusLabel(status)}
                </span>
              ))}
            </div>
          </div>
        </section>

        {userError ? (
          <section className="rounded-[24px] border border-[#efc2c2] bg-[#fff4f4] px-5 py-4 text-sm text-[#a63f3f]">
            {userError}
          </section>
        ) : null}

        {userSuccess ? (
          <section className="rounded-[24px] border border-[#d5e8dc] bg-[#eef8f1] px-5 py-4 text-sm text-[#2f7d55]">
            {userSuccess}
          </section>
        ) : null}

        <section className="grid gap-8">
          <div className="flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/90 px-6 py-5 shadow-[0_18px_45px_rgba(91,54,35,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Tableau principal
            </p>
            <h2 className="font-serif text-3xl text-[#2d1d17]">
              Commandes a traiter dans le dashboard
            </h2>
            <p className="text-sm leading-7 text-[#6f5b50]">
              La liste ci-dessous suit maintenant la recherche, les filtres, le tri et le mode non
              lu pour aider l&apos;equipe a travailler plus vite.
            </p>
          </div>

          {filteredActiveOrders.length === 0 && showUnreadOnly ? (
            <article className="rounded-[28px] border border-dashed border-[#dcc3b5] bg-white/80 px-6 py-8 text-sm text-[#8f786c]">
              Aucune commande non lue dans le tableau principal pour le moment.
            </article>
          ) : null}
          {filteredActiveOrders.length === 0 && !showUnreadOnly ? (
            <article className="rounded-[28px] border border-dashed border-[#dcc3b5] bg-white/80 px-6 py-8 text-sm text-[#8f786c]">
              Aucune commande active ne correspond aux filtres actuels.
            </article>
          ) : null}
          {filteredActiveOrders.map((order) => (
            <OrderCard
              key={`${order.id}-${order.updatedAt}`}
              canPrepareReview={canManageAppUsers(currentUser.role) && reviewsFeatureEnabled}
              isHighlighted={highlightedOrderId === order.id}
              isUnread={effectiveUnreadOrderIds.includes(order.id)}
              hasPreparedReview={reviewsByOrderId.has(order.id)}
              onPrepareReview={handlePrepareReviewFromOrder}
              onCreateInformationRequest={handleCreateInformationRequest}
              onSave={handleUpdateOrder}
              order={order}
              requestSaving={requestOrderId === order.id}
              saving={savingOrderId === order.id}
              teamMembers={users}
            />
          ))}
        </section>

        {filteredArchivedOrders.length > 0 ? (
          <section className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Archives
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2d1d17]">
              Commandes sorties du tableau principal
            </h2>
            <div className="mt-6 grid gap-8">
              {filteredArchivedOrders.map((order) => (
                <OrderCard
                  key={`${order.id}-${order.updatedAt}`}
                  canPrepareReview={canManageAppUsers(currentUser.role) && reviewsFeatureEnabled}
                  isHighlighted={highlightedOrderId === order.id}
                  isUnread={effectiveUnreadOrderIds.includes(order.id)}
                  hasPreparedReview={reviewsByOrderId.has(order.id)}
                  onPrepareReview={handlePrepareReviewFromOrder}
                  onCreateInformationRequest={handleCreateInformationRequest}
                  onSave={handleUpdateOrder}
                  order={order}
                  requestSaving={requestOrderId === order.id}
                  saving={savingOrderId === order.id}
                  teamMembers={users}
                />
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
