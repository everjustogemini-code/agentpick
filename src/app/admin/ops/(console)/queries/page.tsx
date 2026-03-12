import { QuerySetsClient } from "@/lib/ops/client";
import { listQuerySets } from "@/lib/ops/data";

export default async function QuerySetsPage() {
  const querySets = await listQuerySets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Query Sets</h1>
        <p className="mt-2 text-sm text-black/60">Edit benchmark prompts inline, version them by domain, and generate fresh 50-query sets on demand.</p>
      </div>
      <QuerySetsClient initialQuerySets={querySets} />
    </div>
  );
}
