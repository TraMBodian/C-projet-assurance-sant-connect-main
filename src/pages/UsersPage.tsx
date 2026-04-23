import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Stethoscope, Search, Mail, Building2, ShieldCheck,
  Trash2, CheckCircle, Clock, XCircle, Ban, Phone, MapPin,
  UserCheck, UserX, RefreshCw, AlertCircle,
} from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { apiClient } from "@/services/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const roleConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ADMIN:       { label: "Admin",       color: "bg-blue-100 text-blue-800",     icon: <ShieldCheck className="w-3 h-3" /> },
  PRESTATAIRE: { label: "Prestataire", color: "bg-purple-100 text-purple-800", icon: <Stethoscope className="w-3 h-3" /> },
  CLIENT:      { label: "Client",      color: "bg-emerald-100 text-emerald-800", icon: <Users className="w-3 h-3" /> },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ACTIVE:    { label: "Actif",      color: "bg-green-100 text-green-700",   icon: <CheckCircle className="w-3 h-3" /> },
  PENDING:   { label: "En attente", color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3" /> },
  REJECTED:  { label: "Rejeté",     color: "bg-red-100 text-red-700",       icon: <XCircle className="w-3 h-3" /> },
  SUSPENDED: { label: "Suspendu",   color: "bg-gray-100 text-gray-700",     icon: <Ban className="w-3 h-3" /> },
};

function getInitials(name: string) {
  if (!name) return "?";
  return name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
}

const FILTERS = [
  { key: "all",         label: "Tous"        },
  { key: "ADMIN",       label: "Admins"      },
  { key: "PRESTATAIRE", label: "Prestataires"},
  { key: "CLIENT",      label: "Clients"     },
  { key: "PENDING",     label: "En attente"  },
] as const;

type FilterKey = typeof FILTERS[number]["key"];

export default function UsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === "admin";

  const loadUsers = () => {
    setLoading(true);
    setError(null);
    apiClient.getUsers()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.users ?? []);
        setUsers(list);
      })
      .catch(() => setError("Impossible de charger les utilisateurs."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const updateStatus = async (u: any, newStatus: string, label: string) => {
    setActioningId(String(u.id));
    try {
      await apiClient.updateUser(String(u.id), { status: newStatus });
      setUsers((prev) => prev.map((x) => String(x.id) === String(u.id) ? { ...x, status: newStatus } : x));
      const name = u.fullName || u.full_name || u.email;
      toast({ title: label, description: `${name} est maintenant ${statusConfig[newStatus]?.label?.toLowerCase()}.` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
    } finally { setActioningId(null); }
  };

  const handleDelete = async (u: any) => {
    const name = u.fullName || u.full_name || u.email;
    if (!window.confirm(`Supprimer définitivement "${name}" ?`)) return;
    setActioningId(String(u.id));
    try {
      await apiClient.deleteUser(String(u.id));
      setUsers((prev) => prev.filter((x) => String(x.id) !== String(u.id)));
      toast({ title: "Utilisateur supprimé", description: `${name} a été supprimé.` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer l'utilisateur.", variant: "destructive" });
    } finally { setActioningId(null); }
  };

  const filtered = users.filter((u) => {
    const role   = (u.role   || "").toUpperCase();
    const status = (u.status || "").toUpperCase();
    const matchRole =
      filter === "all"     ? true :
      filter === "PENDING" ? status === "PENDING" :
      role === filter;
    const name = u.fullName || u.full_name || "";
    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.organization || "").toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts = {
    total:        users.length,
    prestataires: users.filter((u) => (u.role || "").toUpperCase() === "PRESTATAIRE").length,
    clients:      users.filter((u) => (u.role || "").toUpperCase() === "CLIENT").length,
    pending:      users.filter((u) => (u.status || "").toUpperCase() === "PENDING").length,
  };

  return (
    <AppLayout title="Gestion des utilisateurs">
      <div className="space-y-4 sm:space-y-5">

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Total",        value: counts.total,        color: "text-blue-600"    },
            { label: "Prestataires", value: counts.prestataires, color: "text-purple-600"  },
            { label: "Clients",      value: counts.clients,      color: "text-emerald-600" },
            { label: "En attente",   value: counts.pending,      color: "text-yellow-600", clickable: true },
          ].map(c => (
            <Card
              key={c.label}
              className={`p-3 sm:p-4 text-center ${c.clickable ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${c.clickable && filter === "PENDING" ? "ring-2 ring-yellow-400" : ""}`}
              onClick={c.clickable ? () => setFilter(filter === "PENDING" ? "all" : "PENDING") : undefined}
            >
              <p className={`text-xl sm:text-2xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{c.label}</p>
            </Card>
          ))}
        </div>

        {/* ── Recherche + filtres ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Rechercher par nom, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-card text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none shrink-0">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  filter === key
                    ? key === "PENDING" ? "bg-yellow-500 text-white" : "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Contenu ────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <Card className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-600 font-medium text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={loadUsers}>Réessayer</Button>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center text-gray-500 text-sm">
            {search || filter !== "all"
              ? "Aucun utilisateur ne correspond à votre recherche."
              : "Aucun utilisateur enregistré."}
          </Card>
        ) : (
          /* Desktop : tableau / Mobile : cartes */
          <>
            {/* Tableau desktop */}
            <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Utilisateur</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rôle</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => {
                    const role      = (u.role   || "").toUpperCase();
                    const status    = (u.status || "ACTIVE").toUpperCase();
                    const roleCfg   = roleConfig[role]     || { label: role,   color: "bg-gray-100 text-gray-800", icon: null };
                    const statusCfg = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-800", icon: null };
                    const name      = u.fullName || u.full_name || "—";
                    const isCurrentUser = String(u.id) === String(currentUser?.id);
                    const isBusy    = actioningId === String(u.id);
                    return (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                              {getInitials(name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{name} {isCurrentUser && <span className="text-blue-600 text-xs">(vous)</span>}</p>
                              <p className="text-xs text-muted-foreground truncate lg:hidden">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-sm text-muted-foreground truncate max-w-[200px]">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${roleCfg.color}`}>
                            {roleCfg.icon} {roleCfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                            {statusCfg.icon} {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isAdmin && !isCurrentUser && (
                            <div className="flex items-center justify-end gap-0.5">
                              {status === "PENDING" && (<>
                                <Button size="sm" variant="ghost" title="Approuver" disabled={isBusy}
                                  className="text-green-600 hover:bg-green-50 h-8 w-8 p-0"
                                  onClick={() => updateStatus(u, "ACTIVE", "Compte approuvé")}>
                                  <UserCheck className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" title="Rejeter" disabled={isBusy}
                                  className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                                  onClick={() => updateStatus(u, "REJECTED", "Compte rejeté")}>
                                  <UserX className="w-3.5 h-3.5" />
                                </Button>
                              </>)}
                              {status === "ACTIVE" && (
                                <Button size="sm" variant="ghost" title="Suspendre" disabled={isBusy}
                                  className="text-orange-500 hover:bg-orange-50 h-8 w-8 p-0"
                                  onClick={() => updateStatus(u, "SUSPENDED", "Compte suspendu")}>
                                  <Ban className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {(status === "SUSPENDED" || status === "REJECTED") && (
                                <Button size="sm" variant="ghost" title="Réactiver" disabled={isBusy}
                                  className="text-blue-500 hover:bg-blue-50 h-8 w-8 p-0"
                                  onClick={() => updateStatus(u, "ACTIVE", "Compte réactivé")}>
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" title="Supprimer" disabled={isBusy}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                onClick={() => handleDelete(u)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cartes mobile */}
            <div className="md:hidden space-y-2 sm:space-y-3">
              {filtered.map((u) => {
                const role      = (u.role   || "").toUpperCase();
                const status    = (u.status || "ACTIVE").toUpperCase();
                const roleCfg   = roleConfig[role]     || { label: role,   color: "bg-gray-100 text-gray-800", icon: null };
                const statusCfg = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-800", icon: null };
                const name      = u.fullName || u.full_name || "—";
                const isCurrentUser = String(u.id) === String(currentUser?.id);
                const isBusy    = actioningId === String(u.id);
                return (
                  <Card
                    key={u.id}
                    className={`p-3 sm:p-4 ${status === "PENDING" ? "border-yellow-300 bg-yellow-50/30" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {getInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                          {isCurrentUser && <span className="text-xs text-blue-600 font-medium shrink-0">(vous)</span>}
                          <Badge className={`inline-flex items-center gap-0.5 text-xs px-1.5 shrink-0 ${roleCfg.color}`}>
                            {roleCfg.icon} <span className="ml-0.5">{roleCfg.label}</span>
                          </Badge>
                          <Badge className={`inline-flex items-center gap-0.5 text-xs px-1.5 shrink-0 ${statusCfg.color}`}>
                            {statusCfg.icon} <span className="ml-0.5">{statusCfg.label}</span>
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <Mail className="w-3 h-3 shrink-0" />{u.email}
                          </span>
                          {u.telephone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 shrink-0" />{u.telephone}
                            </span>
                          )}
                          {u.organization && (
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <Building2 className="w-3 h-3 shrink-0" />{u.organization}
                            </span>
                          )}
                        </div>
                        {(u.createdAt || u.created_at) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Inscrit le {new Date(u.createdAt || u.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                      {isAdmin && !isCurrentUser && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          {status === "PENDING" && (<>
                            <Button size="sm" variant="ghost" title="Approuver" disabled={isBusy}
                              className="text-green-600 hover:bg-green-50 h-8 w-8 p-0"
                              onClick={() => updateStatus(u, "ACTIVE", "Compte approuvé")}>
                              <UserCheck className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Rejeter" disabled={isBusy}
                              className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                              onClick={() => updateStatus(u, "REJECTED", "Compte rejeté")}>
                              <UserX className="w-4 h-4" />
                            </Button>
                          </>)}
                          {status === "ACTIVE" && (
                            <Button size="sm" variant="ghost" title="Suspendre" disabled={isBusy}
                              className="text-orange-500 hover:bg-orange-50 h-8 w-8 p-0"
                              onClick={() => updateStatus(u, "SUSPENDED", "Compte suspendu")}>
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                          {(status === "SUSPENDED" || status === "REJECTED") && (
                            <Button size="sm" variant="ghost" title="Réactiver" disabled={isBusy}
                              className="text-blue-500 hover:bg-blue-50 h-8 w-8 p-0"
                              onClick={() => updateStatus(u, "ACTIVE", "Compte réactivé")}>
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" title="Supprimer" disabled={isBusy}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                            onClick={() => handleDelete(u)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
