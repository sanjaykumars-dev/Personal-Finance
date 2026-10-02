import { create } from "zustand";
import type { Transaction, TransactionType } from "@/types";
import { createId } from "@/utils/id";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface UIState {
  /** The global add/edit transaction modal. `editing` null means "add". */
  transactionModal: { open: boolean; editing: Transaction | null; defaultType: TransactionType };
  openAddTransaction: (type?: TransactionType) => void;
  openEditTransaction: (transaction: Transaction) => void;
  closeTransactionModal: () => void;

  toasts: Toast[];
  toast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: string) => void;
}

/** Ephemeral UI state; intentionally not persisted. */
export const useUIStore = create<UIState>()((set) => ({
  transactionModal: { open: false, editing: null, defaultType: "expense" },
  openAddTransaction: (type = "expense") => set({ transactionModal: { open: true, editing: null, defaultType: type } }),
  openEditTransaction: (transaction) =>
    set({ transactionModal: { open: true, editing: transaction, defaultType: transaction.type } }),
  closeTransactionModal: () => set((s) => ({ transactionModal: { ...s.transactionModal, open: false } })),

  toasts: [],
  toast: (message, tone = "success") => set((s) => ({ toasts: [...s.toasts.slice(-3), { id: createId("toast"), message, tone }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Callable outside React (e.g. from utilities). */
export const toast = (message: string, tone?: ToastTone): void => useUIStore.getState().toast(message, tone);
