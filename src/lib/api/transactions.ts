import { apiFetch } from "./client";
import type { Transaction } from "../types";

interface TransactionResponse {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  status: string;
  createdAt: string;
}

function mapTransaction(r: TransactionResponse): Transaction {
  return {
    id: r.id,
    userId: r.userId,
    courseId: r.courseId,
    amount: r.amount,
    status: r.status as Transaction["status"],
    date: r.createdAt,
  };
}

export const transactionsApi = {
  listByUser: async (_userId: string): Promise<Transaction[]> => {
    const res = await apiFetch<TransactionResponse[]>("/transactions");
    return res.map(mapTransaction);
  },

  listAll: async (): Promise<Transaction[]> => {
    const res = await apiFetch<TransactionResponse[]>("/transactions/all");
    return res.map(mapTransaction);
  },

  purchase: async (_userId: string, courseId: string): Promise<Transaction> => {
    const res = await apiFetch<{ transaction: TransactionResponse; enrollment: unknown }>(
      "/transactions",
      { method: "POST", body: JSON.stringify({ courseId }) },
    );
    return mapTransaction(res.transaction);
  },
};
