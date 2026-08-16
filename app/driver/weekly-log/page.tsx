import { redirect } from "next/navigation";

export default function WeeklyLogPage() {
  redirect("/driver?tab=weekly-log");
}

