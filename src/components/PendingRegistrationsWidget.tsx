import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronRight } from "@/components/ui/Icons";
import { useNavigate } from "react-router-dom";

export const PendingRegistrationsWidget = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      loadPendingCount();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadPendingCount = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users?status=pending&count=true`,
        {
          headers: {
            "Authorization": `Bearer ${sessionStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to load count");

      const data = await response.json();
      setCount(data.count || 0);
    } catch (error) {
      console.error("Error loading pending count:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || count === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50 p-6 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">
              Inscriptions en attente d'approbation
            </h3>
            <p className="text-sm text-amber-800 mt-1">
              {count} nouvelle{count > 1 ? "s" : ""} inscription{count > 1 ? "s" : ""} en attente de révision
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/registrations")}
          className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          Examiner
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
