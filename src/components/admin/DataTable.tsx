import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Search, X } from "@/components/ui/Icons";
import TablePagination from "./TablePagination";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends object> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVal(obj: any, key: string): any {
  return key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function compareVal(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "fr", { sensitivity: "base" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DataTable<T extends object>({
  data,
  columns,
  rowKey,
  searchable = true,
  searchPlaceholder = "Rechercher…",
  searchKeys,
  defaultPageSize = 20,
  pageSizeOptions = [10, 20, 50],
  emptyMessage = "Aucun résultat",
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const [search,   setSearch]   = useState("");
  const [sortKey,  setSortKey]  = useState<string>("");
  const [sortDir,  setSortDir]  = useState<"asc" | "desc">("asc");
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const handleSort = (key: string) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = [...data];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const keys = searchKeys ?? (columns.map(c => c.key as string));
      result = result.filter(row =>
        keys.some(k => String(getVal(row, k as string) ?? "").toLowerCase().includes(q))
      );
    }
    return result;
  }, [data, search, searchKeys, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const cmp = compareVal(getVal(a, sortKey), getVal(b, sortKey));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const paginated = useMemo(() => {
    const from = (page - 1) * pageSize;
    return sorted.slice(from, from + pageSize);
  }, [sorted, page, pageSize]);

  return (
    <div className="flex flex-col gap-3">
      {/* Barre de recherche */}
      {searchable && (
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={searchPlaceholder}
            className="pl-8 pr-8 py-2 w-full rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-[#1B5299]/30"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                {columns.map(col => (
                  <th
                    key={String(col.key)}
                    className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap select-none ${
                      col.sortable ? "cursor-pointer hover:text-foreground" : ""
                    } ${col.className ?? ""}`}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && sortKey === String(col.key) && (
                        sortDir === "asc"
                          ? <ChevronUp size={12} className="shrink-0" />
                          : <ChevronDown size={12} className="shrink-0" />
                      )}
                    </div>
                  </th>
                ))}
                {actions && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginated.map(row => (
                  <tr
                    key={rowKey(row)}
                    onClick={() => onRowClick?.(row)}
                    className={`hover:bg-muted/20 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                  >
                    {columns.map(col => (
                      <td key={String(col.key)} className={`px-4 py-3 ${col.className ?? ""}`}>
                        {col.render ? col.render(row) : String(getVal(row, String(col.key)) ?? "—")}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={s => { setPageSize(s); setPage(1); }}
          pageSizeOptions={pageSizeOptions}
        />
      </div>
    </div>
  );
}
