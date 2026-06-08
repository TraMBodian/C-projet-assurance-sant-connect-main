import { AlertCircle, Loader2 } from "@/components/ui/Icons";

interface ErrorStateProps {
  message?: string;
  className?: string;
}

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function ErrorState({ message = "Impossible de charger les données", className = "" }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center h-48 gap-2 text-center px-4 ${className}`}>
      <AlertCircle size={32} className="text-destructive opacity-60" />
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs text-muted-foreground">Service temporairement indisponible</p>
    </div>
  );
}

export function LoadingState({ message = "Chargement...", className = "" }: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center h-48 gap-3 text-muted-foreground ${className}`}>
      <Loader2 size={22} className="animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
