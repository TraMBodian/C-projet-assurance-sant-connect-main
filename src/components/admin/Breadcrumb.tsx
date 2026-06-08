import { Link } from "react-router-dom";
import { ChevronRight } from "@/components/ui/Icons";

interface Crumb {
  label: string;
  path?: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-4" aria-label="Fil d'Ariane">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="shrink-0 opacity-50" />}
            {isLast || !item.path ? (
              <span className={isLast ? "text-foreground font-medium" : ""}>{item.label}</span>
            ) : (
              <Link to={item.path} className="hover:text-foreground transition-colors hover:underline">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
