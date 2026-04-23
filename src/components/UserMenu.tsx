import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings, User } from "@/components/ui/Icons";

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (!user) return null;

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || "U";

  const roleLabel = {
    admin: "Administrateur",
    prestataire: "Prestataire",
    client: "Client",
  }[user.role || "client"];

  const roleBgColor = {
    admin: "bg-blue-100 text-blue-700",
    prestataire: "bg-purple-100 text-purple-700",
    client: "bg-emerald-100 text-emerald-700",
  }[user.role || "client"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/60 transition-colors outline-none">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-xs font-semibold text-gray-900 leading-tight">
              {user.full_name || user.email}
            </span>
            <span className={`text-[10px] px-1.5 py-px rounded-full font-medium ${roleBgColor}`}>
              {roleLabel}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-semibold">{user.full_name}</span>
            <span className="text-xs text-gray-500">{user.email}</span>
            {user.organization && (
              <span className="text-xs text-gray-500">{user.organization}</span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>Mon profil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Paramètres</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
