import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

function Icon({ size = 24, strokeWidth = 2, fill = "none", children, ...props }: IconProps & { strokeWidth?: number; fill?: string; children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function Activity({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Icon>;
}

export function AlertCircle({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></Icon>;
}

export function AlertTriangle({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Icon>;
}

export function Archive({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><polyline points="21 8 21 21 3 21 3 8" /><rect width="22" height="5" x="1" y="3" rx="1" /><line x1="10" y1="12" x2="14" y2="12" /></Icon>;
}

export function ArrowLeft({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></Icon>;
}

export function ArrowRight({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icon>;
}

export function Award({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></Icon>;
}

export function Banknote({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></Icon>;
}

export function Bell({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Icon>;
}

export function Bot({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2M20 14h2M15 13v2M9 13v2" /></Icon>;
}

export function Briefcase({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><rect width="20" height="14" x="2" y="7" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></Icon>;
}

export function Building2({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4M10 10h4M10 14h4M10 18h4" /></Icon>;
}

export function Calculator({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="8" x2="16" y1="10" y2="10" /><line x1="8" x2="8.01" y1="14" y2="14" /><line x1="12" x2="12.01" y1="14" y2="14" /><line x1="16" x2="16.01" y1="14" y2="14" /><line x1="8" x2="8.01" y1="18" y2="18" /><line x1="12" x2="12.01" y1="18" y2="18" /><line x1="16" x2="16.01" y1="18" y2="18" /></Icon>;
}

export function Calendar({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></Icon>;
}

export function Camera({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></Icon>;
}

export function Check({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><polyline points="20 6 9 17 4 12" /></Icon>;
}

export function CheckCheck({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></Icon>;
}

export function CheckCircle({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Icon>;
}

export function CheckCircle2({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></Icon>;
}

export function ChevronDown({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="m6 9 6 6 6-6" /></Icon>;
}

export function ChevronLeft({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="m15 18-6-6 6-6" /></Icon>;
}

export function ChevronRight({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="m9 18 6-6-6-6" /></Icon>;
}

export function ChevronUp({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="m18 15-6-6-6 6" /></Icon>;
}

export function Circle({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><circle cx="12" cy="12" r="10" /></Icon>;
}

export function ClipboardList({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><rect width="8" height="4" x="8" y="2" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" /></Icon>;
}

export function Clock({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Icon>;
}

export function Construction({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><rect x="2" y="6" width="20" height="8" rx="1" /><path d="M17 14v7" /><path d="M7 14v7" /><path d="M17 3v3" /><path d="M7 3v3" /><path d="M10 14 2.3 6.3" /><path d="M14 6l7.7 7.7" /><path d="m8 6 8 8" /></Icon>;
}

export function CreditCard({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></Icon>;
}

export function Dot({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><circle cx="12.1" cy="12.1" r="1" /></Icon>;
}

export function Download({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Icon>;
}

export function Edit({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Icon>;
}

export function Eye({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Icon>;
}

export function EyeOff({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></Icon>;
}

export function FileText({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></Icon>;
}

export function FileWarning({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="10" x2="12" y2="14" /><line x1="12" y1="18" x2="12.01" y2="18" /></Icon>;
}

export function Filter({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></Icon>;
}

export function Globe({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Icon>;
}

export function GripVertical({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></Icon>;
}

export function Hash({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></Icon>;
}

export function Heart({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></Icon>;
}

export function Loader2({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></Icon>;
}

export function Lock({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Icon>;
}

export function LogOut({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Icon>;
}

export function Mail({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></Icon>;
}

export function MapPin({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Icon>;
}

export function Menu({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="18" x2="20" y2="18" /></Icon>;
}

export function MessageCircle({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></Icon>;
}

export function Mic({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></Icon>;
}

export function MicOff({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><line x1="2" y1="2" x2="22" y2="22" /><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" /><path d="M5 10v2a7 7 0 0 0 12 5" /><path d="M15 9.34V5a3 3 0 0 0-5.94-.6" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12" /><line x1="12" y1="19" x2="12" y2="22" /></Icon>;
}

export function MoreHorizontal({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></Icon>;
}

export function PanelLeft({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /></Icon>;
}

export function Pencil({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></Icon>;
}

export function Phone({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 14.3a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 3.4h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 11a16 16 0 0 0 5.91 5.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 17.92z" /></Icon>;
}

export function PhoneOff({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.9 19.91" /><path d="M22 22 2 2" /><path d="M3.43 4.44A19.79 19.79 0 0 0 3.06 3.4A2 2 0 0 0 1 5.12v3a2 2 0 0 0 1.72 2 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 .45 2.11L4.71 14.1A16 16 0 0 0 7.31 17.51" /></Icon>;
}

export function Pill({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></Icon>;
}

export function Plus({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>;
}

export function Printer({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></Icon>;
}

export function QrCode({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></Icon>;
}

export function RefreshCw({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></Icon>;
}

export function Save({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></Icon>;
}

export function Search({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></Icon>;
}

export function Send({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Icon>;
}

export function ServerCrash({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><path d="M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" /><path d="M6 6h.01M6 18h.01" /><path d="m13 6-4 6h6l-4 6" /></Icon>;
}

export function ServerOff({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M7 2h13" /><path d="M7 6h4.38" /><path d="m14.5 6.5.5.5" /><path d="m14 8-1.5 1.5" /><path d="M7 10h6" /><path d="m10 10-.5 8" /><path d="M2 2l20 20" /><path d="M19.5 14c.5 1 .5 2 .5 2v4H7" /><path d="M7 14v4" /><path d="M7 18H2a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h7" /></Icon>;
}

export function Settings({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Icon>;
}

export function Shield({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>;
}

export function ShieldCheck({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></Icon>;
}

export function Star({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Icon>;
}

export function Stethoscope({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" /><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" /></Icon>;
}

export function Trash2({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></Icon>;
}

export function TrendingDown({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></Icon>;
}

export function TrendingUp({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></Icon>;
}

export function User({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>;
}

export function UserCheck({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></Icon>;
}

export function UserMinus({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="22" y1="11" x2="16" y2="11" /></Icon>;
}

export function UserPlus({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></Icon>;
}

export function Users({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>;
}

export function WifiOff({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 4.46-2.91" /><path d="M22 9a16 16 0 0 0-4.43-2.89" /><line x1="2" y1="2" x2="22" y2="22" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></Icon>;
}

export function X({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;
}

export function XCircle({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></Icon>;
}

export function Zap({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Icon>;
}

export function ServerCrashIcon({ size, ...p }: IconProps) {
  return <ServerCrash size={size} {...p} />;
}

export function LayoutDashboard({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></Icon>;
}

export function UserCog({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><circle cx="18" cy="15" r="3" /><circle cx="9" cy="7" r="4" /><path d="M10 15H6a4 4 0 0 0-4 4v2" /><path d="m21.7 16.4-.9-.3" /><path d="m15.2 13.9-.9-.3" /><path d="m16.6 18.7.3-.9" /><path d="m19.1 12.2.3-.9" /><path d="m19.6 18.7-.4-1" /><path d="m16.8 12.3-.4-1" /><path d="m14.3 16.6 1-.4" /><path d="m20.7 13.8 1-.4" /></Icon>;
}

export function BarChart2({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" /></Icon>;
}

export function Ban({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><circle cx="12" cy="12" r="10" /><line x1="4.93" x2="19.07" y1="4.93" y2="19.07" /></Icon>;
}

export function UserX({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" x2="22" y1="11" y2="16" /><line x1="22" x2="17" y1="11" y2="16" /></Icon>;
}

export function FileSpreadsheet({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M8 13h2" /><path d="M14 13h2" /><path d="M8 17h2" /><path d="M14 17h2" /></Icon>;
}

export function ArrowRightLeft({ size, ...p }: IconProps) {
  return <Icon size={size} {...p}><path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" /></Icon>;
}
