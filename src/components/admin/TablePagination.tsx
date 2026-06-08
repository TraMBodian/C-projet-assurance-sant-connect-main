import { ChevronLeft, ChevronRight } from "@/components/ui/Icons";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (s: number) => void;
  pageSizeOptions?: number[];
}

export default function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
      {/* Compteur */}
      <p className="shrink-0">
        {total === 0 ? "Aucun résultat" : `${from}–${to} sur ${total}`}
      </p>

      {/* Pages + nav */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <NavBtn onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Page précédente">
            <ChevronLeft size={13} />
          </NavBtn>

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="w-7 text-center select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
                  p === page
                    ? "bg-[#1B5299] text-white"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {p}
              </button>
            )
          )}

          <NavBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Page suivante">
            <ChevronRight size={13} />
          </NavBtn>
        </div>
      )}

      {/* Taille de page */}
      {onPageSizeChange && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span>Lignes :</span>
          <select
            value={pageSize}
            onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
            className="rounded border border-input bg-background px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-[#1B5299]/40"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function NavBtn({ children, disabled, onClick, "aria-label": label }: { children: React.ReactNode; disabled: boolean; onClick: () => void; "aria-label": string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [];
  pages.push(1);
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}
