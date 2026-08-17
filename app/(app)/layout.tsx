import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { TimezoneSync } from "@/components/TimezoneSync";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <TimezoneSync />
      <Sidebar />
      <MobileNav />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
