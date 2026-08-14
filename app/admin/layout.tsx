import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== "SUPER_ADMIN" && session.user.role !== "TRANSPORT_MANAGER")
  ) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-background">
      <Sidebar role={session.user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={{
            name: session.user.name || "",
            email: session.user.email || "",
            role: session.user.role,
          }}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
