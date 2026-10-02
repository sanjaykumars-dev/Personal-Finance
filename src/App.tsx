import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { FullScreenMessage } from "./components/auth/AuthLayout";
import { AccountGate } from "./components/auth/AccountGate";
import { Toaster } from "./components/common/Toaster";
import { AppLayout } from "./components/layout/AppLayout";
import { useThemeEffect } from "./hooks/useTheme";

// Route-level code splitting keeps charts out of the initial bundle for non-chart pages.
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const TransactionsPage = lazy(() => import("./pages/TransactionsPage"));
const BudgetsPage = lazy(() => import("./pages/BudgetsPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

export function App() {
  useThemeEffect();
  return (
    <BrowserRouter>
      <Suspense fallback={<FullScreenMessage title="Loading…" />}>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route
            element={
              <AccountGate>
                <AppLayout />
              </AccountGate>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  );
}
