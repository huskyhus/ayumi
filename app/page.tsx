import { getDashboardData } from "@/lib/domain/habit/dashboard";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const dashboardHabits = await getDashboardData();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Ayumi</h1>
      <DashboardClient initialHabits={dashboardHabits} />
    </div>
  );
}
