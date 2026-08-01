import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "DRIVER") {
    redirect("/login");
  }

  return (
    <div className="fixed inset-0 flex h-full w-full overflow-hidden bg-background">
      <Sidebar role="DRIVER" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={{
            name: session.user.name || "",
            email: session.user.email || "",
            role: "DRIVER",
          }}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
