import { ScheduleClient } from "@/lib/ops/client";
import { getScheduleSnapshot } from "@/lib/ops/data";

export default async function SchedulePage() {
  const snapshot = await getScheduleSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Scheduling</h1>
        <p className="mt-2 text-sm text-black/60">Tune fleet-wide defaults, inspect frequency spread, and bulk-apply a new cadence when needed.</p>
      </div>
      <ScheduleClient {...snapshot} />
    </div>
  );
}
