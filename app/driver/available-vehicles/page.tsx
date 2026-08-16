import { redirect } from "next/navigation";

export default function AvailableVehiclesPage() {
  redirect("/driver?tab=vehicles");
}

