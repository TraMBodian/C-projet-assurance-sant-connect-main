import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/services/apiClient";
import { isStrongPassword, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/password";

type Step = "email" | "otp" | "newpass" | "done";

const BRAND    = "#1B5299";
const GRADIENT = "linear-gradient(135deg, #1e3c72, #2a5298)";
const RESEND_DELAY = 60; // secondes

// ─── Indicateur de force du mot de passe ─────────────────────────────────────
function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  if (pwd.length === 0) return { score: 0, label: "",          color: "" };
  let score = 0;
  if (pwd.length >= 8)               score++;
  if (/[A-Z]/.test(pwd))            score++;
  if (/[0-9]/.test(pwd))            score++;
  if (/[^A-Za-z0-9]/.test(pwd))     score++;
  const map = [
    { label: "Très faible",  color: "#ef4444" },
    { label: "Faible",       color: "#f97316" },
    { label: "Moyen",        color: "#eab308" },
    { label: "Fort",         color: "#22c55e" },
    { label: "Très fort",    color: "#16a34a" },
  ];
  return { score, ...map[score] };
}

// ─── Input OTP 6 cases séparées ───────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = value.split("");
      if (next[i]) {
        next[i] = "";
        onChange(next.join(""));
      } else if (i > 0) {
        next[i - 1] = "";
        onChange(next.join(""));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const next = value.padEnd(6, " ").split("");
    next[i] = digit;
    const joined = next.join("").trimEnd();
    onChange(joined);
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const nextFocus = Math.min(pasted.length, 5);
    refs.current[nextFocus]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className="w-11 h-13 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all"
          style={{
            height: 52,
            borderColor: value[i] ? BRAND : "#e5e7eb",
            boxShadow:   value[i] ? `0 0 0 3px rgba(27,82,153,0.15)` : "none",
            background:  value[i] ? "rgba(27,82,153,0.04)" : "white",
          }}
        />
      ))}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step,        setStep]        = useState<Step>("email");
  const [email,       setEmail]       = useState("");
  const [code,        setCode]        = useState("");
  const [pwd,         setPwd]         = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [countdown,   setCountdown]   = useState(0);

  // Décompte pour "Renvoyer le code"
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const startCountdown = () => setCountdown(RESEND_DELAY);

  // ── Étape 1 : envoi du code ────────────────────────────────────────────────
  const handleEmail = async () => {
    if (!email.trim()) return setError("Veuillez saisir votre adresse email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Format d'email invalide");
    setError(""); setLoading(true);
    try {
      await apiClient.request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setStep("otp");
      startCountdown();
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // ── Étape 2 : vérification OTP ────────────────────────────────────────────
  const handleOtp = async () => {
    if (code.length !== 6) return setError("Le code doit contenir 6 chiffres");
    setError(""); setLoading(true);
    try {
      await apiClient.request("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      setStep("newpass");
    } catch (e: any) {
      setError(e.message || "Code invalide ou expiré");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  // ── Renvoi du code ────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    setError(""); setLoading(true);
    try {
      await apiClient.request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setCode("");
      startCountdown();
    } catch (e: any) {
      setError(e.message || "Impossible de renvoyer le code");
    } finally {
      setLoading(false);
    }
  };

  // ── Étape 3 : nouveau mot de passe ───────────────────────────────────────
  const handleReset = async () => {
    if (!isStrongPassword(pwd)) return setError(PASSWORD_REQUIREMENTS_MESSAGE);
    if (pwd !== confirm)   return setError("Les mots de passe ne correspondent pas");
    setError(""); setLoading(true);
    try {
      await apiClient.request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code, newPassword: pwd }),
      });
      setStep("done");
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(pwd);
  const steps: Step[] = ["email", "otp", "newpass"];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: GRADIENT }}>

      {/* Cercles décoratifs */}
      <div className="fixed -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">

        {/* Header coloré */}
        <div className="px-8 pt-8 pb-6" style={{ background: "linear-gradient(135deg, #f8faff, #eef2ff)" }}>
          <button onClick={() => navigate("/login")}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-6 transition-colors">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour à la connexion
          </button>

          {/* Icône centrale */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: GRADIENT }}>
              {step === "email"   && (
                <svg width="26" height="26" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              )}
              {step === "otp"     && (
                <svg width="26" height="26" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              )}
              {step === "newpass" && (
                <svg width="26" height="26" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              )}
              {step === "done"    && (
                <svg width="26" height="26" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>

          {/* Titre et sous-titre */}
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {step === "email"   && "Mot de passe oublié ?"}
              {step === "otp"     && "Code de vérification"}
              {step === "newpass" && "Nouveau mot de passe"}
              {step === "done"    && "Mot de passe modifié !"}
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              {step === "email"   && "Entrez votre adresse email pour recevoir un code de vérification"}
              {step === "otp"     && <>Un code à 6 chiffres a été envoyé à <span className="font-semibold text-gray-700">{email}</span></>}
              {step === "newpass" && "Choisissez un mot de passe sécurisé pour votre compte"}
              {step === "done"    && "Votre mot de passe a été réinitialisé avec succès"}
            </p>
          </div>

          {/* Barre de progression */}
          {step !== "done" && (
            <div className="flex items-center gap-2 mt-5 justify-center">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={{
                      background: i < stepIdx ? "#22c55e" : i === stepIdx ? BRAND : "#e5e7eb",
                      color:      i <= stepIdx ? "white" : "#9ca3af",
                    }}>
                    {i < stepIdx
                      ? <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="h-0.5 w-10 rounded-full transition-all duration-300"
                      style={{ background: i < stepIdx ? "#22c55e" : "#e5e7eb" }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Corps */}
        <div className="px-8 pb-8 pt-6 space-y-4">

          {/* ── Étape 1 : Email ─────────────────────────────────────────────── */}
          {step === "email" && (
            <>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleEmail()}
                  placeholder="votre@email.com"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm outline-none transition-all"
                  style={{ borderColor: error ? "#ef4444" : "#e5e7eb" }}
                  onFocus={e => { if (!error) e.target.style.borderColor = BRAND; }}
                  onBlur={e => { if (!error) e.target.style.borderColor = "#e5e7eb"; }}
                />
              </div>
              {error && <ErrorBox message={error} />}
              <PrimaryButton onClick={handleEmail} loading={loading} label="Envoyer le code" />
            </>
          )}

          {/* ── Étape 2 : OTP ───────────────────────────────────────────────── */}
          {step === "otp" && (
            <>
              <OtpInput value={code} onChange={v => { setCode(v); setError(""); }} />

              {error && <ErrorBox message={error} />}

              <PrimaryButton
                onClick={handleOtp}
                loading={loading}
                disabled={code.length !== 6}
                label="Vérifier le code"
              />

              {/* Renvoyer le code */}
              <div className="text-center pt-1">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-400">
                    Renvoyer le code dans{" "}
                    <span className="font-semibold text-gray-600">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-sm font-medium transition-colors"
                    style={{ color: BRAND }}
                  >
                    Renvoyer le code
                  </button>
                )}
              </div>
              <button onClick={() => { setStep("email"); setCode(""); setError(""); }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors">
                Changer d'adresse email
              </button>
            </>
          )}

          {/* ── Étape 3 : Nouveau mot de passe ──────────────────────────────── */}
          {step === "newpass" && (
            <>
              {/* Nouveau mot de passe */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPwd ? "text" : "password"}
                  value={pwd}
                  onChange={e => { setPwd(e.target.value); setError(""); }}
                  placeholder="Nouveau mot de passe"
                  autoFocus
                  className="w-full pl-10 pr-10 py-3 border-2 rounded-xl text-sm outline-none transition-all"
                  style={{ borderColor: error ? "#ef4444" : "#e5e7eb" }}
                  onFocus={e => { if (!error) e.target.style.borderColor = BRAND; }}
                  onBlur={e => { if (!error) e.target.style.borderColor = "#e5e7eb"; }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  <EyeIcon open={showPwd} />
                </button>
              </div>

              {/* Barre de force */}
              {pwd.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                        style={{ background: i < strength.score ? strength.color : "#e5e7eb" }} />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strength.color }}>
                    {strength.label}
                    {strength.score < 3 && (
                      <span className="text-gray-400 font-normal ml-1">
                        — ajoutez {strength.score < 2 ? "majuscules, chiffres et symboles" : "chiffres ou symboles"}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Confirmation */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleReset()}
                  placeholder="Confirmer le mot de passe"
                  className="w-full pl-10 pr-10 py-3 border-2 rounded-xl text-sm outline-none transition-all"
                  style={{
                    borderColor: confirm && pwd !== confirm ? "#ef4444"
                                : confirm && pwd === confirm ? "#22c55e"
                                : "#e5e7eb",
                  }}
                  onFocus={e => { e.target.style.borderColor = BRAND; }}
                  onBlur={e => {
                    if (confirm && pwd !== confirm)       e.target.style.borderColor = "#ef4444";
                    else if (confirm && pwd === confirm)  e.target.style.borderColor = "#22c55e";
                    else                                  e.target.style.borderColor = "#e5e7eb";
                  }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>

              {/* Match indicator */}
              {confirm.length > 0 && (
                <p className="text-xs flex items-center gap-1.5" style={{ color: pwd === confirm ? "#22c55e" : "#ef4444" }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    {pwd === confirm
                      ? <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
                  </svg>
                  {pwd === confirm ? "Les mots de passe correspondent" : "Les mots de passe ne correspondent pas"}
                </p>
              )}

              {error && <ErrorBox message={error} />}
              <PrimaryButton
                onClick={handleReset}
                loading={loading}
                disabled={!isStrongPassword(pwd) || pwd !== confirm}
                label="Réinitialiser le mot de passe"
              />
            </>
          )}

          {/* ── Étape 4 : Succès ────────────────────────────────────────────── */}
          {step === "done" && (
            <div className="flex flex-col items-center py-4 gap-5 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.12)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="w-8 h-8">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <button onClick={() => navigate("/login")}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: GRADIENT }}>
                Se connecter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Composants utilitaires ───────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600">
      <svg className="shrink-0 mt-0.5" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
      </svg>
      {message}
    </div>
  );
}

function PrimaryButton({ onClick, loading, disabled, label }: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: "linear-gradient(135deg, #1B5299, #2a5298)" }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Traitement en cours…
        </span>
      ) : label}
    </button>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open
    ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
