import { z } from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Transaction } from "@/types";
import { createId } from "@/utils/id";
import { transactionSchema } from "@/utils/schemas";
import { initialData, persistOptions, STORAGE_KEYS } from "./persistence";

export type TransactionInput = Omit<Transaction, "id">;

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (input: TransactionInput) => Transaction;
  updateTransaction: (id: string, input: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
  addMany: (inputs: TransactionInput[]) => void;
  /** Points every transaction in `fromId` at `toId`. */
  reassignCategory: (fromId: string, toId: string) => void;
  setTransactions: (transactions: Transaction[]) => void;
}

function clean(input: TransactionInput): TransactionInput {
  const notes = input.notes?.trim();
  const { notes: _notes, ...rest } = input;
  return { ...rest, description: input.description.trim(), ...(notes ? { notes } : {}) };
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: initialData.transactions,
      addTransaction: (input) => {
        const transaction = { ...clean(input), id: createId("txn") };
        set((s) => ({ transactions: [transaction, ...s.transactions] }));
        return transaction;
      },
      updateTransaction: (id, input) =>
        set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? { ...clean(input), id } : t)) })),
      deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      addMany: (inputs) =>
        set((s) => ({ transactions: [...inputs.map((input) => ({ ...clean(input), id: createId("txn") })), ...s.transactions] })),
      reassignCategory: (fromId, toId) =>
        set((s) => ({ transactions: s.transactions.map((t) => (t.categoryId === fromId ? { ...t, categoryId: toId } : t)) })),
      setTransactions: (transactions) => set({ transactions }),
    }),
    persistOptions(STORAGE_KEYS.transactions, z.object({ transactions: z.array(transactionSchema) }), (s) => ({
      transactions: s.transactions,
    })),
  ),
);
