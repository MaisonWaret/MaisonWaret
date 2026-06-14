const siteConfig = window.MAISON_WARET_CONFIG || {};
const products = Array.isArray(siteConfig.products) ? siteConfig.products : [];

const storageKeys = {
  cart: "maison-waret-cart",
  orders: "maison-waret-orders",
  adminUsers: "maison-waret-admin-users",
  adminSession: "maison-waret-admin-session",
  adminLogs: "maison-waret-admin-logs"
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPrice(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(Number(value) || 0);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseStoredDate(value) {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = String(value).match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:[ ,](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!match) return null;

  const [, day, month, year, hours = "0", minutes = "0", seconds = "0"] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds)
  );
}

function normalizeRole(role) {
  if (role === "owner" || role === "manager" || role === "employee") {
    return role;
  }
  return "employee";
}

function getRoleLabel(role) {
  if (role === "owner") return "Admin principal";
  if (role === "manager") return "Manager";
  if (role === "customer") return "Client";
  if (role === "system") return "Systeme";
  return "Employe";
}

function buildSessionSnapshot(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role)
  };
}

function createAuditEntry(type, actor, notes, meta = {}) {
  const now = new Date();
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    actorId: actor?.id ?? null,
    actorName: actor?.name ?? "Systeme",
    actorRole: actor?.role ?? "system",
    notes: String(notes || ""),
    meta,
    createdAtIso: now.toISOString(),
    createdAt: formatDateTime(now)
  };
}

function migrateUsers(users) {
  if (!Array.isArray(users)) return [];

  const migrated = users.map((user, index) => {
    const createdDate = parseStoredDate(user.createdAtIso || user.createdAt) || new Date();
    return {
      id: user.id || Date.now() + index,
      name: String(user.name || "Admin").trim(),
      email: String(user.email || "").trim().toLowerCase(),
      password: String(user.password || ""),
      role: normalizeRole(user.role || (index === 0 ? "owner" : "employee")),
      active: user.active !== false,
      createdAtIso: user.createdAtIso || createdDate.toISOString(),
      createdAt: user.createdAt || formatDateTime(createdDate)
    };
  });

  if (migrated.length > 0 && !migrated.some((user) => user.role === "owner")) {
    migrated[0].role = "owner";
  }

  return migrated;
}

function migrateOrders(orders) {
  if (!Array.isArray(orders)) return [];

  return orders.map((order, index) => {
    const createdDate = parseStoredDate(order.createdAtIso || order.createdAt) || new Date();
    const status = ["pending", "accepted", "refused"].includes(order.status)
      ? order.status
      : "pending";

    return {
      id: order.id || Date.now() + index,
      createdAtIso: order.createdAtIso || createdDate.toISOString(),
      createdAt: order.createdAt || formatDateTime(createdDate),
      status,
      archived: Boolean(order.archived),
      customerName: String(order.customerName || ""),
      customerEmail: String(order.customerEmail || ""),
      customerPhone: String(order.customerPhone || ""),
      requestedDate: String(order.requestedDate || ""),
      deliveryAddress: String(order.deliveryAddress || ""),
      notes: String(order.notes || ""),
      items: Array.isArray(order.items)
        ? order.items.map((item) => ({
            id: String(item.id || ""),
            name: String(item.name || ""),
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1
          }))
        : [],
      estimatedTotal: Number(order.estimatedTotal) || 0,
      refusalReason: String(order.refusalReason || ""),
      acceptedBy: order.acceptedBy || null,
      refusedBy: order.refusedBy || null,
      lastActionBy: order.lastActionBy || null,
      lastActionAt: String(order.lastActionAt || ""),
      lastActionType: String(order.lastActionType || ""),
      events: Array.isArray(order.events)
        ? order.events.map((event) => ({
            ...event,
            notes: String(event.notes || ""),
            createdAtIso: event.createdAtIso || createdDate.toISOString(),
            createdAt:
              event.createdAt ||
              formatDateTime(parseStoredDate(event.createdAtIso || event.createdAt) || createdDate)
          }))
        : []
    };
  });
}

function migrateAdminLogs(logs) {
  if (!Array.isArray(logs)) return [];

  return logs.map((entry, index) => {
    const createdDate = parseStoredDate(entry.createdAtIso || entry.createdAt) || new Date();
    return {
      id: entry.id || Date.now() + index,
      type: String(entry.type || "info"),
      actorId: entry.actorId ?? null,
      actorName: String(entry.actorName || "Systeme"),
      actorRole: String(entry.actorRole || "system"),
      notes: String(entry.notes || ""),
      meta: entry.meta && typeof entry.meta === "object" ? entry.meta : {},
      createdAtIso: entry.createdAtIso || createdDate.toISOString(),
      createdAt: entry.createdAt || formatDateTime(createdDate)
    };
  });
}

function ensureAppStorage() {
  saveAdminUsers(migrateUsers(getAdminUsers()));
  saveOrders(migrateOrders(getOrders()));
  saveAdminLogs(migrateAdminLogs(getAdminLogs()));
}

function getCart() {
  return readJson(storageKeys.cart, []);
}

function saveCart(cart) {
  writeJson(storageKeys.cart, cart);
}

function getOrders() {
  return readJson(storageKeys.orders, []);
}

function saveOrders(orders) {
  writeJson(storageKeys.orders, orders);
}

function getAdminUsers() {
  return readJson(storageKeys.adminUsers, []);
}

function saveAdminUsers(users) {
  writeJson(storageKeys.adminUsers, users);
}

function getAdminSession() {
  return readJson(storageKeys.adminSession, null);
}

function saveAdminSession(session) {
  writeJson(storageKeys.adminSession, session);
}

function clearAdminSession() {
  localStorage.removeItem(storageKeys.adminSession);
}

function getAdminLogs() {
  return readJson(storageKeys.adminLogs, []);
}

function saveAdminLogs(logs) {
  writeJson(storageKeys.adminLogs, logs);
}

function appendAdminLog(entry) {
  const logs = getAdminLogs();
  logs.unshift(entry);
  saveAdminLogs(logs.slice(0, 200));
}

function getCurrentSessionUser() {
  const session = getAdminSession();
  if (!session) return null;

  const user = getAdminUsers().find((item) => String(item.id) === String(session.id));
  if (!user || user.active === false) {
    clearAdminSession();
    return null;
  }

  return user;
}

function canManageUsers(user) {
  return Boolean(user && user.role === "owner");
}

function canDeleteOrders(user) {
  return Boolean(user && (user.role === "owner" || user.role === "manager"));
}

function applySiteConfig() {
  const brand = siteConfig.brand || {};
  const ordering = siteConfig.ordering || {};
  const admin = siteConfig.admin || {};

  document.querySelectorAll("[data-brand-name]").forEach((node) => {
    node.textContent = brand.name || "Maison Waret";
  });
  document.querySelectorAll("[data-brand-subtitle]").forEach((node) => {
    node.textContent = brand.subtitle || "Patisserie artisanale";
  });
  document.querySelectorAll("[data-admin-subtitle]").forEach((node) => {
    node.textContent = brand.adminSubtitle || "Dashboard commandes";
  });
  document.querySelectorAll("[data-private-label]").forEach((node) => {
    node.textContent = brand.privateLabel || "Espace prive";
  });
  document.querySelectorAll("[data-hero-eyebrow]").forEach((node) => {
    node.textContent = brand.heroEyebrow || "Commandes sur demande";
  });
  document.querySelectorAll("[data-hero-title]").forEach((node) => {
    node.textContent = brand.heroTitle || "";
  });
  document.querySelectorAll("[data-hero-text]").forEach((node) => {
    node.textContent = brand.heroText || "";
  });
  document.querySelectorAll("[data-footer-text]").forEach((node) => {
    node.textContent = brand.footerText || "";
  });
  document.querySelectorAll("[data-order-delivery]").forEach((node) => {
    node.textContent = ordering.deliveryMode || "";
  });
  document.querySelectorAll("[data-order-validation]").forEach((node) => {
    node.textContent = ordering.validationText || "";
  });
  document.querySelectorAll("[data-order-payment]").forEach((node) => {
    node.textContent = ordering.paymentText || "";
  });
  document.querySelectorAll("[data-order-delivery-short]").forEach((node) => {
    node.textContent = ordering.deliveryMode || "";
  });
  document.querySelectorAll("[data-order-delay]").forEach((node) => {
    node.textContent = ordering.minimumDelayLabel || "";
  });
  document.querySelectorAll("[data-order-payment-short]").forEach((node) => {
    node.textContent = ordering.paymentText || "Apres validation";
  });
  document.querySelectorAll("[data-order-products]").forEach((node) => {
    node.textContent = ordering.productsLabel || "";
  });
  document.querySelectorAll("[data-admin-login-name]").forEach((node) => {
    node.textContent = admin.loginPageName || "";
  });
  document.querySelectorAll("[data-admin-login-description]").forEach((node) => {
    node.textContent = admin.loginDescription || "";
  });
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      quantity: 1
    });
  }

  saveCart(cart);
  renderCart();
}

function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.id !== productId);
  saveCart(cart);
  renderCart();
}

function renderProducts() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = products
    .map((product) => `
      <article class="product-card">
        <div class="product-body">
          <span class="product-badge">${escapeHtml(product.category)}</span>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.description)}</p>
          <div class="product-meta">
            <span class="price">${formatPrice(product.price)}</span>
            <button class="button button-primary button-small" data-add="${escapeHtml(product.id)}">Ajouter</button>
          </div>
        </div>
      </article>
    `)
    .join("");

  grid.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => addToCart(button.dataset.add));
  });
}

function renderCart() {
  const cartList = document.getElementById("cart-list");
  const cartTotal = document.getElementById("cart-total");
  if (!cartList || !cartTotal) return;

  const cart = getCart();
  if (cart.length === 0) {
    cartList.innerHTML = `
      <div class="cart-item">
        <div>
          <strong>Aucun produit pour l'instant</strong>
          <small>Ajoutez des produits depuis le catalogue.</small>
        </div>
      </div>
    `;
    cartTotal.textContent = formatPrice(0);
    return;
  }

  cartList.innerHTML = cart
    .map((item) => `
      <div class="cart-item">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <small>Quantite : ${escapeHtml(item.quantity)}</small>
        </div>
        <div>
          <strong>${formatPrice(item.price * item.quantity)}</strong>
          <div class="admin-actions" style="margin-top:8px;">
            <button class="button button-secondary button-small" data-remove="${escapeHtml(item.id)}">Retirer</button>
          </div>
        </div>
      </div>
    `)
    .join("");

  cartList.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => removeFromCart(button.dataset.remove));
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = formatPrice(total);
}

function setOrderMinimumDate(form) {
  const requestedDateField = form.querySelector('input[name="requestedDate"]');
  if (!requestedDateField) return;

  const minimumDate = new Date();
  minimumDate.setDate(minimumDate.getDate() + Number(siteConfig.ordering?.minimumDelayDays || 2));
  requestedDateField.min = formatDateInput(minimumDate);
}

function setupOrderForm() {
  const form = document.getElementById("order-form");
  const feedback = document.getElementById("form-feedback");
  if (!form || !feedback) return;

  setOrderMinimumDate(form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const cart = getCart();
    if (cart.length === 0) {
      feedback.textContent = "Ajoute d'abord au moins un produit dans le panier.";
      feedback.className = "form-feedback error";
      return;
    }

    const formData = new FormData(form);
    const requestedDate = String(formData.get("requestedDate") || "");
    const minimumDate = new Date();
    minimumDate.setDate(minimumDate.getDate() + Number(siteConfig.ordering?.minimumDelayDays || 2));
    const requested = new Date(requestedDate);

    if (Number.isNaN(requested.getTime()) || requested < new Date(minimumDate.toDateString())) {
      feedback.textContent = "Merci de choisir une date avec au moins 48h de delai.";
      feedback.className = "form-feedback error";
      return;
    }

    const now = new Date();
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orders = getOrders();
    const orderId = Date.now();
    const order = {
      id: orderId,
      createdAtIso: now.toISOString(),
      createdAt: formatDateTime(now),
      status: "pending",
      archived: false,
      customerName: String(formData.get("customerName") || "").trim(),
      customerEmail: String(formData.get("customerEmail") || "").trim(),
      customerPhone: String(formData.get("customerPhone") || "").trim(),
      requestedDate,
      deliveryAddress: String(formData.get("deliveryAddress") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
      items: cart.map((item) => ({ ...item })),
      estimatedTotal: total,
      refusalReason: "",
      acceptedBy: null,
      refusedBy: null,
      lastActionBy: null,
      lastActionAt: "",
      lastActionType: "",
      events: [
        createAuditEntry("order_created", { name: "Client", role: "customer" }, "Demande envoyee depuis le site.", {
          orderId
        })
      ]
    };

    orders.unshift(order);
    saveOrders(orders);
    appendAdminLog(
      createAuditEntry(
        "order_created",
        { name: "Client", role: "customer" },
        `Nouvelle demande de ${order.customerName}.`,
        {
          orderId,
          customerName: order.customerName
        }
      )
    );

    saveCart([]);
    form.reset();
    setOrderMinimumDate(form);
    renderCart();

    feedback.textContent = "Votre demande a bien ete enregistree. Vous recevrez ensuite une validation ou un refus.";
    feedback.className = "form-feedback success";
  });
}

function getStatusLabel(status) {
  if (status === "accepted") return "Acceptee";
  if (status === "refused") return "Refusee";
  return "En attente";
}

function getLatestOrderSummary(order) {
  if (order.status === "accepted" && order.acceptedBy) {
    return `
      <span class="status-badge status-accepted">Acceptee</span>
      <small>Par ${escapeHtml(order.acceptedBy.name || "Admin")}<br>${escapeHtml(order.lastActionAt || "")}</small>
    `;
  }

  if (order.status === "refused" && order.refusedBy) {
    return `
      <span class="status-badge status-refused">Refusee</span>
      <small>Par ${escapeHtml(order.refusedBy.name || "Admin")}<br>${escapeHtml(order.lastActionAt || "")}</small>
      ${order.refusalReason ? `<small>Motif : ${escapeHtml(order.refusalReason)}</small>` : ""}
    `;
  }

  return `<span class="status-badge status-pending">En attente</span>`;
}

function setAdminFeedback(message, type) {
  const feedback = document.getElementById("admin-feedback");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.className = `form-feedback ${type || ""}`.trim();
}

function updateAdminTopbar() {
  const userBox = document.getElementById("admin-userbox");
  const logoutButton = document.getElementById("logout-button");
  if (!userBox || !logoutButton) return;

  const user = getCurrentSessionUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  userBox.innerHTML = `
    <strong>Connecte :</strong> ${escapeHtml(user.name)}<br>
    <small>${escapeHtml(user.email)} · ${escapeHtml(getRoleLabel(user.role))}</small>
  `;

  if (!logoutButton.dataset.bound) {
    logoutButton.dataset.bound = "true";
    logoutButton.addEventListener("click", () => {
      clearAdminSession();
      window.location.href = "login.html";
    });
  }
}

function protectAdminPage() {
  if (!document.getElementById("admin-orders-body")) return;
  if (!getCurrentSessionUser()) {
    window.location.href = "login.html";
  }
}

function updateRegisterAvailability() {
  const registerForm = document.getElementById("register-form");
  const registerFeedback = document.getElementById("register-feedback");
  const registerButton = document.querySelector('[data-tab="register"]');
  const heading = document.querySelector("#register-tab h2");
  if (!registerForm || !registerFeedback || !registerButton || !heading) return;

  const hasUsers = getAdminUsers().length > 0;
  const fields = registerForm.querySelectorAll("input, button");

  if (hasUsers) {
    heading.textContent = "Premier compte deja cree";
    registerButton.textContent = "Compte initial";
    fields.forEach((field) => {
      field.disabled = true;
    });
    registerFeedback.textContent =
      "Le premier compte admin existe deja. Connecte-toi, puis cree les comptes employes depuis l'admin principal.";
    registerFeedback.className = "form-feedback";
    return;
  }

  heading.textContent = "Creer le premier compte admin";
  registerButton.textContent = "Creer un compte";
  fields.forEach((field) => {
    field.disabled = false;
  });
  registerFeedback.textContent =
    "Cette inscription sert uniquement a creer le premier compte admin principal.";
  registerFeedback.className = "form-feedback";
}

function setupLoginPage() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginFeedback = document.getElementById("login-feedback");
  const registerFeedback = document.getElementById("register-feedback");
  const tabButtons = document.querySelectorAll("[data-tab]");
  const tabContents = document.querySelectorAll(".tab-content");

  if (!loginForm || !registerForm || !loginFeedback || !registerFeedback) return;

  updateRegisterAvailability();

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((item) => item.classList.remove("active"));
      tabContents.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(`${button.dataset.tab}-tab`).classList.add("active");
    });
  });

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (getAdminUsers().length > 0) {
      registerFeedback.textContent =
        "Le premier compte existe deja. Les autres comptes se creent depuis l'admin principal.";
      registerFeedback.className = "form-feedback error";
      return;
    }

    const formData = new FormData(registerForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!name || !email || password.length < 6) {
      registerFeedback.textContent = "Merci de remplir tous les champs avec un mot de passe valide.";
      registerFeedback.className = "form-feedback error";
      return;
    }

    const now = new Date();
    const users = [
      {
        id: Date.now(),
        name,
        email,
        password,
        role: "owner",
        active: true,
        createdAtIso: now.toISOString(),
        createdAt: formatDateTime(now)
      }
    ];

    saveAdminUsers(users);
    appendAdminLog(
      createAuditEntry(
        "user_created",
        { id: users[0].id, name, role: "owner" },
        "Creation du premier compte admin principal.",
        { email, role: "owner" }
      )
    );
    registerForm.reset();
    updateRegisterAvailability();
    registerFeedback.textContent = "Compte admin principal cree. Tu peux maintenant te connecter.";
    registerFeedback.className = "form-feedback success";
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const users = getAdminUsers();
    const user = users.find(
      (item) => item.email === email && item.password === password && item.active !== false
    );

    if (!user) {
      loginFeedback.textContent = "Identifiants invalides ou compte desactive.";
      loginFeedback.className = "form-feedback error";
      return;
    }

    saveAdminSession(buildSessionSnapshot(user));
    loginFeedback.textContent = "Connexion reussie. Redirection vers l'admin...";
    loginFeedback.className = "form-feedback success";
    setTimeout(() => {
      window.location.href = "admin.html";
    }, 600);
  });
}

function getMonthLabels() {
  return ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];
}

function renderYearlySummary(orders) {
  const container = document.getElementById("yearly-summary");
  if (!container) return;

  const currentYear = new Date().getFullYear();
  const months = getMonthLabels().map((label) => ({
    label,
    count: 0,
    acceptedTotal: 0
  }));

  orders.forEach((order) => {
    const createdDate = parseStoredDate(order.createdAtIso || order.createdAt);
    if (!createdDate || createdDate.getFullYear() !== currentYear) return;

    const month = createdDate.getMonth();
    months[month].count += 1;
    if (order.status === "accepted") {
      months[month].acceptedTotal += Number(order.estimatedTotal) || 0;
    }
  });

  const maxCount = Math.max(...months.map((month) => month.count), 1);
  const totalOrders = months.reduce((sum, month) => sum + month.count, 0);
  const acceptedTurnover = months.reduce((sum, month) => sum + month.acceptedTotal, 0);

  container.innerHTML = `
    <div class="year-bars">
      ${months
        .map(
          (month) => `
            <div class="year-bar-row">
              <span>${month.label}</span>
              <div class="year-bar-track">
                <div class="year-bar-fill" style="width:${(month.count / maxCount) * 100}%"></div>
              </div>
              <strong>${month.count}</strong>
            </div>
          `
        )
        .join("")}
    </div>
    <p class="year-summary-text">
      ${totalOrders} commande(s) en ${currentYear} · ${formatPrice(acceptedTurnover)} de chiffre estime sur les commandes acceptees.
    </p>
  `;
}

function getLogLabel(type) {
  const labels = {
    order_created: "Nouvelle commande",
    order_accepted: "Commande acceptee",
    order_refused: "Commande refusee",
    order_archived: "Commande archivee",
    order_restored: "Commande restauree",
    order_deleted: "Commande supprimee",
    user_created: "Compte cree",
    user_disabled: "Compte desactive",
    user_reactivated: "Compte reactive",
    user_deleted: "Compte supprime"
  };
  return labels[type] || "Activite";
}

function renderActivityLog() {
  const container = document.getElementById("activity-log");
  if (!container) return;

  const logs = getAdminLogs();
  if (logs.length === 0) {
    container.innerHTML = `<div class="empty-state">Aucune activite pour le moment.</div>`;
    return;
  }

  container.innerHTML = logs
    .slice(0, 10)
    .map((entry) => `
      <article class="activity-item">
        <div class="activity-topline">
          <strong>${escapeHtml(getLogLabel(entry.type))}</strong>
          <small>${escapeHtml(entry.createdAt)}</small>
        </div>
        <p>${escapeHtml(entry.notes)}</p>
        <small>
          ${escapeHtml(entry.actorName)} · ${escapeHtml(getRoleLabel(entry.actorRole))}
          ${entry.meta?.customerName ? `· ${escapeHtml(entry.meta.customerName)}` : ""}
        </small>
      </article>
    `)
    .join("");
}

function handleOrderAction(action, orderId) {
  const currentUser = getCurrentSessionUser();
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const orders = getOrders();
  const orderIndex = orders.findIndex((item) => String(item.id) === String(orderId));
  if (orderIndex === -1) return;

  const order = orders[orderIndex];
  const actor = buildSessionSnapshot(currentUser);
  const actionDate = formatDateTime(new Date());

  if (action === "accept") {
    const note = window.prompt("Note interne optionnelle pour cette acceptation :", "") ?? "";
    order.status = "accepted";
    order.refusalReason = "";
    order.acceptedBy = actor;
    order.refusedBy = null;
    order.lastActionBy = actor;
    order.lastActionAt = actionDate;
    order.lastActionType = "accepted";
    order.events.unshift(
      createAuditEntry("order_accepted", actor, note || "Commande acceptee.", { orderId: order.id })
    );
    appendAdminLog(
      createAuditEntry(
        "order_accepted",
        actor,
        `Commande de ${order.customerName} acceptee.`,
        { orderId: order.id, customerName: order.customerName }
      )
    );
    setAdminFeedback("Commande acceptee et historisee.", "success");
  }

  if (action === "refuse") {
    const reason = (window.prompt("Motif du refus (obligatoire) :", order.refusalReason || "") || "").trim();
    if (!reason) {
      setAdminFeedback("Le motif du refus est obligatoire.", "error");
      return;
    }

    order.status = "refused";
    order.refusalReason = reason;
    order.refusedBy = actor;
    order.acceptedBy = null;
    order.lastActionBy = actor;
    order.lastActionAt = actionDate;
    order.lastActionType = "refused";
    order.events.unshift(
      createAuditEntry("order_refused", actor, reason, { orderId: order.id })
    );
    appendAdminLog(
      createAuditEntry(
        "order_refused",
        actor,
        `Commande de ${order.customerName} refusee. Motif : ${reason}`,
        { orderId: order.id, customerName: order.customerName }
      )
    );
    setAdminFeedback("Commande refusee avec motif enregistre.", "success");
  }

  if (action === "archive") {
    order.archived = true;
    order.lastActionBy = actor;
    order.lastActionAt = actionDate;
    order.lastActionType = "archived";
    order.events.unshift(
      createAuditEntry("order_archived", actor, "Commande archivee.", { orderId: order.id })
    );
    appendAdminLog(
      createAuditEntry(
        "order_archived",
        actor,
        `Commande de ${order.customerName} archivee.`,
        { orderId: order.id, customerName: order.customerName }
      )
    );
    setAdminFeedback("Commande archivee.", "success");
  }

  if (action === "restore") {
    order.archived = false;
    order.lastActionBy = actor;
    order.lastActionAt = actionDate;
    order.lastActionType = "restored";
    order.events.unshift(
      createAuditEntry("order_restored", actor, "Commande restauree dans la liste active.", {
        orderId: order.id
      })
    );
    appendAdminLog(
      createAuditEntry(
        "order_restored",
        actor,
        `Commande de ${order.customerName} restauree.`,
        { orderId: order.id, customerName: order.customerName }
      )
    );
    setAdminFeedback("Commande restauree dans la liste active.", "success");
  }

  if (action === "delete") {
    if (!canDeleteOrders(currentUser)) {
      setAdminFeedback("Seul un admin principal ou un manager peut supprimer une commande.", "error");
      return;
    }
    const confirmed = window.confirm(
      `Supprimer definitivement la commande de ${order.customerName} ?`
    );
    if (!confirmed) return;

    orders.splice(orderIndex, 1);
    saveOrders(orders);
    appendAdminLog(
      createAuditEntry(
        "order_deleted",
        actor,
        `Commande de ${order.customerName} supprimee definitivement.`,
        { orderId: order.id, customerName: order.customerName }
      )
    );
    setAdminFeedback("Commande supprimee definitivement.", "success");
    renderAdmin();
    return;
  }

  saveOrders(orders);
  renderAdmin();
}

function setupCreateUserForm() {
  const form = document.getElementById("create-user-form");
  if (!form || form.dataset.bound) return;
  form.dataset.bound = "true";

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const currentUser = getCurrentSessionUser();
    if (!canManageUsers(currentUser)) {
      setAdminFeedback("Seul l'admin principal peut creer des comptes.", "error");
      return;
    }

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const role = normalizeRole(String(formData.get("role") || "employee"));

    if (!name || !email || password.length < 6) {
      setAdminFeedback("Merci de remplir tous les champs avec un mot de passe d'au moins 6 caracteres.", "error");
      return;
    }

    const users = getAdminUsers();
    if (users.some((user) => user.email === email)) {
      setAdminFeedback("Un compte existe deja avec cet email.", "error");
      return;
    }

    const now = new Date();
    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      role,
      active: true,
      createdAtIso: now.toISOString(),
      createdAt: formatDateTime(now)
    };

    users.push(newUser);
    saveAdminUsers(users);
    appendAdminLog(
      createAuditEntry(
        "user_created",
        buildSessionSnapshot(currentUser),
        `Compte ${name} cree avec le role ${getRoleLabel(role).toLowerCase()}.`,
        { email, role }
      )
    );
    form.reset();
    setAdminFeedback("Nouveau compte employe cree.", "success");
    renderAdmin();
  });
}

function handleUserAction(action, userId) {
  const currentUser = getCurrentSessionUser();
  if (!canManageUsers(currentUser)) {
    setAdminFeedback("Seul l'admin principal peut gerer les comptes.", "error");
    return;
  }

  const users = getAdminUsers();
  const target = users.find((item) => String(item.id) === String(userId));
  if (!target) return;

  if (String(target.id) === String(currentUser.id) && (action === "disable" || action === "delete")) {
    setAdminFeedback("Tu ne peux pas desactiver ou supprimer ton propre compte.", "error");
    return;
  }

  if (action === "disable") {
    target.active = false;
    appendAdminLog(
      createAuditEntry(
        "user_disabled",
        buildSessionSnapshot(currentUser),
        `Compte ${target.name} desactive.`,
        { email: target.email, role: target.role }
      )
    );
    setAdminFeedback("Compte desactive.", "success");
  }

  if (action === "reactivate") {
    target.active = true;
    appendAdminLog(
      createAuditEntry(
        "user_reactivated",
        buildSessionSnapshot(currentUser),
        `Compte ${target.name} reactive.`,
        { email: target.email, role: target.role }
      )
    );
    setAdminFeedback("Compte reactive.", "success");
  }

  if (action === "delete") {
    const confirmed = window.confirm(`Supprimer definitivement le compte ${target.name} ?`);
    if (!confirmed) return;

    const nextUsers = users.filter((item) => String(item.id) !== String(userId));
    saveAdminUsers(nextUsers);
    appendAdminLog(
      createAuditEntry(
        "user_deleted",
        buildSessionSnapshot(currentUser),
        `Compte ${target.name} supprime.`,
        { email: target.email, role: target.role }
      )
    );
    setAdminFeedback("Compte supprime.", "success");
    renderAdmin();
    return;
  }

  saveAdminUsers(users);
  renderAdmin();
}

function renderAdminUsers() {
  const section = document.getElementById("admin-users-section");
  const body = document.getElementById("admin-users-body");
  if (!section || !body) return;

  const currentUser = getCurrentSessionUser();
  if (!canManageUsers(currentUser)) {
    section.hidden = true;
    return;
  }

  section.hidden = false;

  const users = getAdminUsers();
  body.innerHTML = users
    .map((user) => `
      <tr>
        <td>
          <strong>${escapeHtml(user.name)}</strong><br>
          <small>${escapeHtml(user.email)}</small>
        </td>
        <td>${escapeHtml(getRoleLabel(user.role))}</td>
        <td>
          <span class="status-badge ${user.active ? "status-accepted" : "status-refused"}">
            ${user.active ? "Actif" : "Desactive"}
          </span>
        </td>
        <td>
          <small>Cree le ${escapeHtml(user.createdAt || "")}</small>
        </td>
        <td>
          <div class="admin-actions">
            ${
              String(user.id) === String(currentUser.id)
                ? `<small>Compte connecte</small>`
                : `
                  ${
                    user.active
                      ? `<button class="button button-secondary button-small" data-user-action="disable" data-user-id="${escapeHtml(user.id)}">Desactiver</button>`
                      : `<button class="button button-secondary button-small" data-user-action="reactivate" data-user-id="${escapeHtml(user.id)}">Reactiver</button>`
                  }
                  <button class="button button-secondary button-small" data-user-action="delete" data-user-id="${escapeHtml(user.id)}">Supprimer</button>
                `
            }
          </div>
        </td>
      </tr>
    `)
    .join("");

  body.querySelectorAll("[data-user-action]").forEach((button) => {
    button.addEventListener("click", () => {
      handleUserAction(button.dataset.userAction, button.dataset.userId);
    });
  });
}

function renderAdminOrders(orders, targetId, emptyMessage, archivedView) {
  const body = document.getElementById(targetId);
  if (!body) return;

  const currentUser = getCurrentSessionUser();
  if (orders.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="6">${escapeHtml(emptyMessage)}</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = orders
    .map((order) => `
      <tr>
        <td>
          <strong>${escapeHtml(order.customerName)}</strong><br>
          <small>${escapeHtml(order.customerEmail)}</small><br>
          <small>${escapeHtml(order.customerPhone)}</small><br>
          <small>${escapeHtml(order.deliveryAddress)}</small>
        </td>
        <td>
          <strong>Souhaitee :</strong> ${escapeHtml(order.requestedDate)}<br>
          <small>Creee le ${escapeHtml(order.createdAt)}</small>
        </td>
        <td>
          ${order.items
            .map((item) => `${escapeHtml(item.quantity)} x ${escapeHtml(item.name)}`)
            .join("<br>")}
          ${order.notes ? `<br><small>Note : ${escapeHtml(order.notes)}</small>` : ""}
        </td>
        <td>${formatPrice(order.estimatedTotal)}</td>
        <td class="admin-followup-cell">${getLatestOrderSummary(order)}</td>
        <td>
          <div class="admin-actions">
            ${
              archivedView
                ? `<button class="button button-primary button-small" data-action="restore" data-id="${escapeHtml(order.id)}">Restaurer</button>`
                : `
                  <button class="button button-primary button-small" data-action="accept" data-id="${escapeHtml(order.id)}">Accepter</button>
                  <button class="button button-secondary button-small" data-action="refuse" data-id="${escapeHtml(order.id)}">Refuser</button>
                  <button class="button button-secondary button-small" data-action="archive" data-id="${escapeHtml(order.id)}">Archiver</button>
                `
            }
            ${
              canDeleteOrders(currentUser)
                ? `<button class="button button-secondary button-small" data-action="delete" data-id="${escapeHtml(order.id)}">Supprimer</button>`
                : ""
            }
          </div>
        </td>
      </tr>
    `)
    .join("");

  body.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      handleOrderAction(button.dataset.action, button.dataset.id);
    });
  });
}

function renderAdmin() {
  const stats = document.getElementById("admin-stats");
  if (!stats) return;

  const orders = getOrders();
  const activeOrders = orders.filter((order) => !order.archived);
  const archivedOrders = orders.filter((order) => order.archived);
  const pending = activeOrders.filter((order) => order.status === "pending").length;
  const accepted = activeOrders.filter((order) => order.status === "accepted").length;
  const refused = activeOrders.filter((order) => order.status === "refused").length;
  const activeUsers = getAdminUsers().filter((user) => user.active !== false).length;

  stats.innerHTML = `
    <article><span class="label">Demandes actives</span><strong>${activeOrders.length}</strong></article>
    <article><span class="label">En attente</span><strong>${pending}</strong></article>
    <article><span class="label">Acceptees</span><strong>${accepted}</strong></article>
    <article><span class="label">Refusees</span><strong>${refused}</strong></article>
    <article><span class="label">Archivees</span><strong>${archivedOrders.length}</strong></article>
    <article><span class="label">Comptes actifs</span><strong>${activeUsers}</strong></article>
  `;

  renderYearlySummary(orders);
  renderActivityLog();
  renderAdminOrders(
    activeOrders,
    "admin-orders-body",
    "Aucune commande active pour le moment.",
    false
  );
  renderAdminOrders(
    archivedOrders,
    "archived-orders-body",
    "Aucune commande archivee pour le moment.",
    true
  );
  setupCreateUserForm();
  renderAdminUsers();
}

document.addEventListener("DOMContentLoaded", () => {
  ensureAppStorage();
  applySiteConfig();
  protectAdminPage();
  renderProducts();
  renderCart();
  setupOrderForm();
  setupLoginPage();
  updateAdminTopbar();
  renderAdmin();
});
