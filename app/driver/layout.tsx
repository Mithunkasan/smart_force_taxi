import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DriverNavbar } from "@/components/layout/driver-navbar";
import { Header } from "@/components/layout/header";
import { DriverTabProvider } from "@/components/drivers/driver-portal-context";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  console.log("DRIVER_LAYOUT_SESSION: " + JSON.stringify(session));

  if (!session?.user || session.user.role !== "DRIVER") {
    redirect("/login");
  }

  return (
    <DriverTabProvider>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        <Header
          user={{
            name: session.user.name || "",
            email: session.user.email || "",
            role: "DRIVER",
          }}
        />
        <DriverNavbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
    </DriverTabProvider>
  );
}

