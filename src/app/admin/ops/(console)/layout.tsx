import { requireOpsPageAuth } from "@/lib/ops/auth";
import { LogoutButton } from "@/lib/ops/client";
import { OpsMark, OpsNav } from "@/lib/ops/ui";

export default async function OpsConsoleLayout(props: { children: React.ReactNode }) {
  await requireOpsPageAuth();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-col gap-5 rounded-[32px] border border-black/10 bg-white/70 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          <OpsMark />
          <OpsNav />
        </div>
        <LogoutButton />
      </header>
      <div className="space-y-8">{props.children}</div>
    </main>
  );
}
