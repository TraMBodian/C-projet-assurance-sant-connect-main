import { useRef, useState } from "react";
import { apiClient } from "@/services/apiClient";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE_MB = 10;

interface Props {
  assureId?: number;
  consultationId?: number;
  onUploaded?: (doc: any) => void;
  className?: string;
}

export function DocumentUpload({ assureId, consultationId, onUploaded, className = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const validate = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type))
      return `Type non accepté (${file.type}). Formats : PDF, JPG, PNG, DOC, DOCX`;
    if (file.size > MAX_SIZE_MB * 1024 * 1024)
      return `Fichier trop volumineux (max ${MAX_SIZE_MB} Mo)`;
    return null;
  };

  const upload = async (file: File) => {
    const err = validate(file);
    if (err) { setError(err); return; }
    setError(null);
    setUploading(true);
    try {
      const doc = await apiClient.uploadDocument(file, { assureId, consultationId, description: description || undefined });
      setDescription("");
      onUploaded?.(doc);
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Description (optionnel)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full text-sm border border-border rounded px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-brand"
      />

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragging ? "border-brand bg-brand/5" : "border-border hover:border-brand/60"}
          ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {uploading ? (
            <span className="text-sm">Envoi en cours…</span>
          ) : (
            <>
              <span className="text-sm font-medium">Glisser-déposer ou cliquer pour choisir</span>
              <span className="text-xs">PDF, JPG, PNG, DOC, DOCX — max {MAX_SIZE_MB} Mo</span>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input ref={inputRef} type="file" className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
        onChange={onFileChange} />
    </div>
  );
}

interface ListProps {
  documents: any[];
  onDelete?: (id: number) => void;
  canDelete?: boolean;
}

export function DocumentList({ documents, onDelete, canDelete }: ListProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const icon = (ct: string) => {
    if (ct === "application/pdf") return "📄";
    if (ct.startsWith("image/")) return "🖼️";
    return "📎";
  };

  if (!documents.length) {
    return <p className="text-sm text-muted-foreground text-center py-4">Aucun document</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {documents.map(doc => (
        <li key={doc.id} className="flex items-center gap-3 py-2.5">
          <span className="text-xl shrink-0">{icon(doc.contentType)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{doc.nom}</p>
            <p className="text-xs text-muted-foreground">
              {formatSize(doc.taille)}
              {doc.description && ` — ${doc.description}`}
            </p>
          </div>
          <a
            href={apiClient.getDocumentDownloadUrl(doc.id)}
            download
            className="text-xs text-brand hover:underline shrink-0"
          >
            Télécharger
          </a>
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(doc.id)}
              className="text-xs text-red-500 hover:underline shrink-0 ml-1"
            >
              Supprimer
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
