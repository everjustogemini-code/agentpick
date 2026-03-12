import { ApiKeysClient } from "@/lib/ops/client";
import { listApiKeys } from "@/lib/ops/data";

export default async function ApiKeysPage() {
  const keys = await listApiKeys();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">API Key Vault</h1>
        <p className="mt-2 text-sm text-black/60">Store encrypted provider and tool keys, test them live, and feed every agent config from one place.</p>
      </div>
      <ApiKeysClient initialKeys={keys} />
    </div>
  );
}
