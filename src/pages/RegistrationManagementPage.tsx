import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Mail } from "@/components/ui/Icons";
import { DataService } from "@/services/dataService";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization?: string;
  created_at: string;
  status: string;
}

const RegistrationManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Load pending registrations
  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const users = await DataService.getUsers();
      const pending = users.filter((user: any) => user.status === "pending");
      setPendingUsers(pending);
    } catch (error) {
      console.error("Error loading pending users:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les inscriptions en attente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    setApproving(userId);
    try {
      await DataService.updateUser(userId, { status: "active" });

      toast({
        title: "Succès",
        description: "Utilisateur approuvé",
      });

      // Remove from pending list
      setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Error approving user:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setApproving(null);
    }
  };

  const rejectUser = async (userId: string) => {
    setRejecting(userId);
    try {
      await DataService.updateUser(userId, { status: "rejected" });

      toast({
        title: "Succès",
        description: "Utilisateur rejeté",
      });

      // Remove from pending list
      setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setRejecting(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-blue-100 text-blue-800",
      prestataire: "bg-purple-100 text-purple-800",
      client: "bg-emerald-100 text-emerald-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrateur",
      prestataire: "Prestataire",
      client: "Client",
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion des inscriptions</h1>
        <p className="text-gray-600 mt-2">
          Approuvez ou rejetez les nouvelles inscriptions ({pendingUsers.length} en attente)
        </p>
      </div>

      {pendingUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune inscription en attente</h3>
          <p className="text-gray-600">Toutes les inscriptions ont été traitées.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="w-3 h-3" />
                      En attente
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    {user.organization && (
                      <p className="text-gray-500">
                        <strong>Organisation :</strong> {user.organization}
                      </p>
                    )}
                    <p className="text-gray-500">
                      <strong>Inscrit :</strong>{" "}
                      {new Date(user.created_at).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rejectUser(user.id)}
                    disabled={rejecting === user.id || approving === user.id}
                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {rejecting === user.id ? "Rejet..." : "Rejeter"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveUser(user.id)}
                    disabled={approving === user.id || rejecting === user.id}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {approving === user.id ? "Approbation..." : "Approuver"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegistrationManagementPage;
