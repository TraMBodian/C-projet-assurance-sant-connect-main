import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X, User } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { DataService } from "@/services/dataService";

export default function NewPolicePage() {
  const navigate = useNavigate();
  const [assures, setAssures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAssure, setSelectedAssure] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    type: "Individuel",
    montantPrime: "",
    couverture: "",
  });

  useEffect(() => {
    DataService.getAssures()
      .then(setAssures)
      .catch(() => {});
  }, []);

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = assures.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.nom?.toLowerCase().includes(q) ||
      a.prenom?.toLowerCase().includes(q) ||
      a.numero?.toLowerCase().includes(q) ||
      a.telephone?.toLowerCase().includes(q)
    );
  });

  const handleSelect = (assure: any) => {
    setSelectedAssure(assure);
    setSearch(`${assure.nom} ${assure.prenom}`);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSelectedAssure(null);
    setSearch("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssure) {
      alert("Veuillez sélectionner un assuré.");
      return;
    }
    setLoading(true);
    try {
      const numero = "POL-" + Date.now();
      await DataService.createPolice({
        numero,
        assure: { id: selectedAssure.id },
        type: formData.type,
        montantPrime: formData.montantPrime ? Number(formData.montantPrime) : null,
        couverture: formData.couverture || null,
      });
      navigate("/polices");
    } catch (err: any) {
      alert("Erreur : " + (err.message || "Impossible de créer la police"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Nouvelle police" subHeader={
      <Button size="sm" onClick={() => navigate("/polices")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl space-y-6">

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Sélecteur assuré avec recherche */}
              <div>
                <Label>Assuré principal</Label>
                <div className="relative mt-2" ref={dropdownRef}>
                  <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-lg bg-background focus-within:ring-2 focus-within:ring-ring">
                    <Search size={16} className="text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setShowDropdown(true);
                        if (!e.target.value) setSelectedAssure(null);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Rechercher par nom, prénom ou numéro..."
                      className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                    />
                    {search && (
                      <button type="button" onClick={handleClear}>
                        <X size={14} className="text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>

                  {/* Résultat sélectionné */}
                  {selectedAssure && (
                    <div className="mt-2 flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{selectedAssure.nom} {selectedAssure.prenom}</p>
                        <p className="text-xs text-muted-foreground">{selectedAssure.numero} · {selectedAssure.telephone || "—"}</p>
                      </div>
                    </div>
                  )}

                  {/* Dropdown liste */}
                  {showDropdown && !selectedAssure && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {filtered.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {assures.length === 0 ? "Aucun assuré enregistré" : "Aucun résultat"}
                        </p>
                      ) : (
                        filtered.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => handleSelect(a)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {a.nom?.[0]}{a.prenom?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{a.nom} {a.prenom}</p>
                              <p className="text-xs text-muted-foreground">{a.numero} · {a.telephone || "—"}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="type">Type de police</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
                >
                  <option value="Individuel">Individuel</option>
                  <option value="Famille">Famille</option>
                  <option value="Groupe">Groupe</option>
                </select>
              </div>

              <div>
                <Label htmlFor="montantPrime">Montant de la prime (FCFA)</Label>
                <Input
                  id="montantPrime"
                  type="number"
                  value={formData.montantPrime}
                  onChange={(e) => setFormData({ ...formData, montantPrime: e.target.value })}
                  required
                  className="mt-2"
                  placeholder="Ex: 50000"
                />
              </div>

              <div>
                <Label htmlFor="couverture">Couverture</Label>
                <Input
                  id="couverture"
                  value={formData.couverture}
                  onChange={(e) => setFormData({ ...formData, couverture: e.target.value })}
                  className="mt-2"
                  placeholder="Ex: Soins ambulatoires, hospitalisation..."
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? "Création en cours..." : "Créer la police"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
