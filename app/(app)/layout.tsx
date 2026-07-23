import { Sidebar } from "@/components/Sidebar";
import { TimezoneSync } from "@/components/TimezoneSync";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <TimezoneSync />
      <Sidebar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
