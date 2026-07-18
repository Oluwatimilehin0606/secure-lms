import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments";
import { ApiError } from "../api/client";
import { Modal } from "./Modal";
import { ErrorMessage } from "./ErrorMessage";
import type { Payment } from "../types";

export function PaymentModal({
  courseId,
  initialPayment,
  onClose,
  onEnrolled,
}: {
  courseId: string;
  initialPayment: Payment;
  onClose: () => void;
  onEnrolled: () => void;
}) {
  const queryClient = useQueryClient();
  const [payment, setPayment] = useState(initialPayment);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirmMutation = useMutation({
    mutationFn: (outcome: "success" | "failure") => paymentsApi.confirm(payment.reference, outcome),
    onSuccess: (result) => {
      setPayment(result.payment);
      setErrorMessage(null);
      if (result.payment.status === "successful") {
        queryClient.invalidateQueries({ queryKey: ["enrollments"] });
        onEnrolled();
      }
    },
    onError: (err) => setErrorMessage(err instanceof ApiError ? err.message : "Something went wrong"),
  });

  const retryMutation = useMutation({
    mutationFn: () => paymentsApi.initiate(courseId),
    onSuccess: (newPayment) => {
      setPayment(newPayment);
      setErrorMessage(null);
    },
    onError: (err) => setErrorMessage(err instanceof ApiError ? err.message : "Something went wrong"),
  });

  return (
    <Modal title="Simulated checkout" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This is a simulated payment gateway &mdash; no real charge occurs. Choose an outcome below to continue.
        </p>

        <div className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Amount</span>
            <span className="font-semibold text-slate-900 dark:text-white">${Number(payment.amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Reference</span>
            <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{payment.reference}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Status</span>
            <span className="capitalize text-slate-900 dark:text-white">{payment.status}</span>
          </div>
        </div>

        {errorMessage && <ErrorMessage message={errorMessage} />}

        {payment.status === "pending" && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => confirmMutation.mutate("success")}
              disabled={confirmMutation.isPending}
              className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Simulate success
            </button>
            <button
              type="button"
              onClick={() => confirmMutation.mutate("failure")}
              disabled={confirmMutation.isPending}
              className="flex-1 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              Simulate failure
            </button>
          </div>
        )}

        {payment.status === "failed" && (
          <button
            type="button"
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            {retryMutation.isPending ? "Starting new payment..." : "Try again"}
          </button>
        )}

        {payment.status === "successful" && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Payment successful &mdash; you&apos;re enrolled!
          </div>
        )}
      </div>
    </Modal>
  );
}
