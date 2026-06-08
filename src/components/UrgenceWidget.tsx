import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, X, AlertTriangle, Heart, AlertCircle } from "@/components/ui/Icons";

const URGENCES = [
  { label: "SAMU",            numero: "15",  color: "bg-red-600",    icon: <AlertCircle size={16} /> },
  { label: "Pompiers",        numero: "18",  color: "bg-orange-600", icon: <AlertTriangle size={16} /> },
  { label: "Police / Gend.", numero: "17",  color: "bg-blue-700",   icon: <Phone size={16} /> },
  { label: "Numéro européen", numero: "112", color: "bg-purple-600", icon: <Phone size={16} /> },
];

export function UrgenceWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.85, y: 12  }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl border border-red-100 w-64 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Heart size={15} />
                <span className="font-bold text-sm">Numéros d'urgence</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 space-y-2">
              {URGENCES.map(u => (
                <a
                  key={u.numero}
                  href={`tel:${u.numero}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${u.color} flex items-center justify-center text-white shrink-0`}>
                      {u.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{u.label}</span>
                  </div>
                  <span className="font-bold text-base text-gray-900 group-hover:text-red-600 transition-colors">
                    {u.numero}
                  </span>
                </a>
              ))}
            </div>

            <div className="px-4 pb-3">
              <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                En cas d'urgence médicale, appelez le 15 ou le 112
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{  scale: 0.95 }}
        onClick={() => setOpen(v => !v)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          open ? "bg-gray-700" : "bg-red-600 hover:bg-red-700"
        } text-white`}
        aria-label="Urgences"
      >
        {open ? <X size={22} /> : <Phone size={22} />}
      </motion.button>
    </div>
  );
}
