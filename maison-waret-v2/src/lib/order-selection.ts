const ORDER_SELECTION_STORAGE_KEY = "maison-waret-order-selection-v1";

function sanitizeSelection(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter((item): item is string => typeof item === "string" && item.trim().length > 0),
    ),
  );
}

export function readOrderSelection() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(ORDER_SELECTION_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    return sanitizeSelection(JSON.parse(rawValue));
  } catch {
    return [];
  }
}

export function writeOrderSelection(productIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  const nextValue = sanitizeSelection(productIds);
  window.localStorage.setItem(ORDER_SELECTION_STORAGE_KEY, JSON.stringify(nextValue));
}

export function addProductToOrderSelection(productId: string) {
  const nextValue = Array.from(new Set([...readOrderSelection(), productId]));
  writeOrderSelection(nextValue);
  return nextValue;
}

export function removeProductFromOrderSelection(productId: string) {
  const nextValue = readOrderSelection().filter((id) => id !== productId);
  writeOrderSelection(nextValue);
  return nextValue;
}

export function clearOrderSelection() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ORDER_SELECTION_STORAGE_KEY);
}
