import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Download, Shield, RefreshCw, X } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { apiClient } from "@/services/apiClient";
import TablePagination from "@/components/admin/TablePagination";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entityId: number | null;
  userEmail: string;
  userRole: string;
  detail: string;
  ipAddress: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700 border-green-200",
  UPDATE: "bg-blue-100 text-blue-700 border-blue-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
  LOGIN:  "bg-purple-100 text-purple-700 border-purple-200",
  LOGOUT: "bg-gray-100 text-gray-700 border-gray-200",
  EXPORT: "bg-amber-100 text-amber-700 border-amber-200",
  VIEW:   "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const ACTIONS: { value: string; label: string }[] = [
  { value: "CREATE",         label: "Création" },
  { value: "UPDATE",         label: "Modification" },
  { value: "DELETE",         label: "Suppression" },
  { value: "LOGIN",          label: "Connexion" },
  { value: "LOGOUT",         label: "Déconnexion" },
  { value: "REGISTER",       label: "Inscription" },
  { value: "PASSWORD_RESET", label: "Réinit. mot de passe" },
  { value: "PASSWORD_CHANGE",label: "Changement mot de passe" },
  { value: "EXPORT",         label: "Export" },
  { value: "VIEW",           label: "Consultation" },
  { value: "USER_DELETE",    label: "Suppression utilisateur" },
];

const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  ACTIONS.map(a => [a.value, a.label])
);

const ENTITIES: { value: string; label: string }[] = [
  { value: "USER",         label: "Utilisateur" },
  { value: "ASSURE",       label: "Assuré" },
  { value: "POLICE",       label: "Police" },
  { value: "SINISTRE",     label: "Sinistre" },
  { value: "PRESTATAIRE",  label: "Prestataire" },
  { value: "TARIF",        label: "Tarif" },
  { value: "PAIEMENT",     label: "Paiement" },
  { value: "PRESTATION",   label: "Prestation" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "PRESCRIPTION", label: "Prescription" },
];

function fmtDate(d?: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
}

function exportCSV(data: AuditLog[], filename: string) {
  const headers = ["Date", "Action", "Entité", "ID", "Utilisateur", "Rôle", "Détail", "IP"];
  const rows = data.map(l => [
    fmtDate(l.createdAt), l.action, l.entity, l.entityId ?? "",
    l.userEmail, l.userRole, l.detail ?? "", l.ipAddress ?? "",
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [logs, setLogs]           = useState<AuditLog[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(50);
  const [loading, setLoading]     = useState(false);

  const [search, setSearch]       = useState("");
  const [actionFilter, setAction] = useState("");
  const [entityFilter, setEntity] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page - 1),
        size: String(pageSize),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (actionFilter)    params.set("action", actionFilter);
      if (entityFilter)    params.set("entity", entityFilter);

      const body = await apiClient.request<any>(`/admin/audit-logs?${params}`);
      setLogs(body.logs ?? []);
      setTotal(body.totalElements ?? 0);
    } catch {
      toast.error("Impossible de charger les journaux d'audit");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, actionFilter, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset to page 1 on filter change
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleAction = (v: string) => { setAction(v); setPage(1); };
  const handleEntity = (v: string) => { setEntity(v); setPage(1); };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (actionFilter)    params.set("action", actionFilter);
      if (entityFilter)    params.set("entity", entityFilter);
      // Utilise l'endpoint dédié qui retourne directement le CSV
      const url = `/api/admin/audit-logs/export${params.toString() ? "?" + params : ""}`;
      const token = apiClient.getToken();
      const res = await fetch(url, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Export échoué");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Erreur lors de l'export");
    }
  };

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-full">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1B5299]/10">
              <Shield className="text-[#1B5299]" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Journal d'audit</h1>
              <p className="text-sm text-muted-foreground">Traçabilité de toutes les actions administratives</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchLogs}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-input bg-background hover:bg-muted transition-colors"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Actualiser
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-[#1B5299] text-white hover:bg-[#0F2D5A] transition-colors"
            >
              <Download size={14} />
              Exporter CSV
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher (email, action, entité…)"
              className="pl-9 pr-8 py-2 w-full rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-[#1B5299]/30"
            />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={actionFilter}
            onChange={e => handleAction(e.target.value)}
            className="px-3 py-2 w-full sm:w-auto min-w-[140px] rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-[#1B5299]/30"
          >
            <option value="">Toutes les actions</option>
            {ACTIONS.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>

          <select
            value={entityFilter}
            onChange={e => handleEntity(e.target.value)}
            className="px-3 py-2 w-full sm:w-auto min-w-[140px] rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-[#1B5299]/30"
          >
            <option value="">Toutes les entités</option>
            {ENTITIES.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
        >
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm gap-2">
              <RefreshCw size={16} className="animate-spin" />
              Chargement…
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <Shield size={32} className="opacity-20" />
              <p className="text-sm">Aucun journal trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    {["Date", "Action", "Entité", "ID", "Utilisateur", "Rôle", "Détail", "IP"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log, i) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.015 }}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                        {fmtDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-foreground">{log.entity ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {log.entityId ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground font-medium">
                        {log.userEmail ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-muted-foreground">{log.userRole ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-xs text-muted-foreground" title={log.detail}>
                        {log.detail ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-muted-foreground">
                        {log.ipAddress ?? "—"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
            pageSizeOptions={[20, 50, 100]}
          />
        </motion.div>
      </div>
    </AppLayout>
  );
}
