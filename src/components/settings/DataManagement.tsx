import { Database, Download, FileJson, FileSpreadsheet, RotateCcw, Sparkles, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getAppData, replaceAppData, resetApplication, restoreSampleData } from "@/store/actions";
import { useCategoryStore } from "@/store/categoryStore";
import { useSessionStore } from "@/store/cloud/session";
import { useTransactionStore } from "@/store/transactionStore";
import { useUIStore } from "@/store/uiStore";
import type { AppData } from "@/types";
import { downloadFile, parseBackup, serializeBackup } from "@/utils/backup";
import { parseTransactionsCSV, pendingCategoryKey, transactionsToCSV, type CSVImportResult } from "@/utils/csv";
import { todayISO } from "@/utils/dates";

type Pending =
  | { kind: "csv"; result: CSVImportResult; fileName: string }
  | { kind: "json"; data: AppData; fileName: string }
  | { kind: "reset" }
  | { kind: "sample" };

const MAX_FILE_BYTES = 5 * 1024 * 1024;

async function readFile(event: ChangeEvent<HTMLInputElement>): Promise<{ text: string; name: string } | null> {
  const file = event.target.files?.[0];
  event.target.value = ""; // allow re-selecting the same file
  if (!file) return null;
  if (file.size > MAX_FILE_BYTES) throw new Error("That file is larger than 5 MB.");
  return { text: await file.text(), name: file.name };
}

function Row({ icon: Icon, title, description, children }: { icon: typeof Download; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted">
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function DataManagement() {
  const toast = useUIStore((s) => s.toast);
  const transactionCount = useTransactionStore((s) => s.transactions.length);
  const inAccount = useSessionStore((s) => s.phase === "ready");
  const csvInput = useRef<HTMLInputElement>(null);
  const jsonInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  const exportCSV = () => {
    const { transactions, categories } = getAppData();
    downloadFile(transactionsToCSV(transactions, categories), `transactions-${todayISO()}.csv`, "text/csv;charset=utf-8");
    toast(`Exported ${transactions.length} transactions`);
  };

  const exportJSON = () => {
    downloadFile(serializeBackup(getAppData()), `finance-backup-${todayISO()}.json`, "application/json");
    toast("Backup downloaded");
  };

  const onCSVSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = await readFile(event);
      if (!file) return;
      const result = parseTransactionsCSV(file.text, useCategoryStore.getState().categories);
      if (result.transactions.length === 0) {
        toast(result.skipped.length > 0 ? `No valid rows found (${result.skipped.length} skipped)` : "The CSV has no transactions", "error");
        return;
      }
      setPending({ kind: "csv", result, fileName: file.name });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Couldn't read that CSV file", "error");
    }
  };

  const onJSONSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = await readFile(event);
      if (!file) return;
      setPending({ kind: "json", data: parseBackup(file.text), fileName: file.name });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Couldn't read that backup", "error");
    }
  };

  const confirm = () => {
    if (!pending) return;
    switch (pending.kind) {
      case "csv": {
        const { result } = pending;
        const { addCategory } = useCategoryStore.getState();
        // Create missing categories, then swap placeholder IDs for real ones.
        const ids = new Map(result.newCategories.map((c) => [pendingCategoryKey(c), addCategory(c).id]));
        useTransactionStore.getState().addMany(result.transactions.map((t) => ({ ...t, categoryId: ids.get(t.categoryId) ?? t.categoryId })));
        toast(`Imported ${result.transactions.length} transactions${result.skipped.length ? ` · ${result.skipped.length} skipped` : ""}`);
        break;
      }
      case "json":
        replaceAppData(pending.data);
        toast("Backup restored");
        break;
      case "reset":
        resetApplication();
        toast("All data cleared");
        break;
      case "sample":
        restoreSampleData();
        toast("Sample data restored");
        break;
    }
    setPending(null);
  };

  const dialog = (() => {
    switch (pending?.kind) {
      case "csv": {
        const { result, fileName } = pending;
        return {
          title: "Import transactions?",
          confirmLabel: `Import ${result.transactions.length}`,
          tone: "primary" as const,
          message: (
            <>
              <span className="font-medium text-fg">{result.transactions.length}</span> transactions from {fileName} will be added to your existing data.
              {result.newCategories.length > 0 && (
                <> New categories will be created: {result.newCategories.map((c) => c.name).join(", ")}.</>
              )}
            </>
          ),
          extra:
            result.skipped.length > 0 ? (
              <div className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
                <p className="font-medium">{result.skipped.length} row{result.skipped.length === 1 ? "" : "s"} will be skipped:</p>
                <ul className="mt-1 space-y-0.5">
                  {result.skipped.slice(0, 5).map((s) => (
                    <li key={s.line}>
                      Line {s.line}: {s.reason}
                    </li>
                  ))}
                  {result.skipped.length > 5 && <li>…and {result.skipped.length - 5} more</li>}
                </ul>
              </div>
            ) : null,
        };
      }
      case "json":
        return {
          title: "Restore this backup?",
          confirmLabel: "Replace my data",
          tone: "danger" as const,
          message: (
            <>
              Everything currently in the app will be replaced with {pending.fileName}: {pending.data.transactions.length} transactions,{" "}
              {pending.data.categories.length} categories, {pending.data.budgets.length} budgets and {pending.data.goals.length} goals.
            </>
          ),
          extra: null,
        };
      case "reset":
        return {
          title: "Reset application?",
          confirmLabel: "Delete everything",
          tone: "danger" as const,
          message: `All transactions, budgets and goals will be permanently deleted${inAccount ? " from your account" : ""}, and categories and profile settings restored to defaults. Consider exporting a backup first.`,
          extra: null,
        };
      case "sample":
        return {
          title: "Restore sample data?",
          confirmLabel: "Replace with sample data",
          tone: "danger" as const,
          message: "Your current data will be replaced with six months of example transactions, budgets and goals.",
          extra: null,
        };
      default:
        return null;
    }
  })();

  return (
    <Card>
      <CardHeader
        title="Data Management"
        description={
          inAccount
            ? "Your data is stored in your account. Changes here sync automatically."
            : "Everything is stored locally in this browser (localStorage). Export a backup to keep it safe."
        }
      />
      <div className="divide-y divide-line p-5">
        <Row icon={FileSpreadsheet} title="Transactions (CSV)" description="Columns: date, type, description, amount, category, notes.">
          <Button size="sm" icon={Download} onClick={exportCSV} disabled={transactionCount === 0}>
            Export CSV
          </Button>
          <Button size="sm" icon={Upload} onClick={() => csvInput.current?.click()}>
            Import CSV
          </Button>
          <input ref={csvInput} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void onCSVSelected(e)} aria-label="Choose CSV file" />
        </Row>
        <Row icon={FileJson} title="Full backup (JSON)" description="Categories, transactions, budgets, goals and settings.">
          <Button size="sm" icon={Download} onClick={exportJSON}>
            Export JSON
          </Button>
          <Button size="sm" icon={Upload} onClick={() => jsonInput.current?.click()}>
            Import JSON
          </Button>
          <input ref={jsonInput} type="file" accept=".json,application/json" className="hidden" onChange={(e) => void onJSONSelected(e)} aria-label="Choose JSON backup" />
        </Row>
        <Row icon={Sparkles} title="Sample data" description="Load six months of realistic example data.">
          <Button size="sm" icon={Database} onClick={() => setPending({ kind: "sample" })}>
            Restore sample data
          </Button>
        </Row>
        <Row icon={RotateCcw} title="Reset application" description="Delete all data and start fresh with default categories.">
          <Button size="sm" variant="danger" icon={RotateCcw} onClick={() => setPending({ kind: "reset" })}>
            Reset
          </Button>
        </Row>
      </div>

      <ConfirmDialog
        open={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmLabel={dialog?.confirmLabel ?? "Confirm"}
        tone={dialog?.tone ?? "danger"}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      >
        {dialog?.extra}
      </ConfirmDialog>
    </Card>
  );
}
