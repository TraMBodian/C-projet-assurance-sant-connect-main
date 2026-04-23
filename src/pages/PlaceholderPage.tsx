import AppLayout from "@/components/AppLayout";
import { Construction } from "@/components/ui/Icons";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <AppLayout title={title}>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Construction size={28} className="text-muted-foreground" />
        </div>
        <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </div>
    </AppLayout>
  );
}
