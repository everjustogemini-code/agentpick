import { LoginForm } from "@/lib/ops/client";
import { OpsMark, Panel } from "@/lib/ops/ui";

export default function OpsLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
      <div className="grid w-full gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <OpsMark />
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight">Control the full benchmark fleet from one locked console.</h1>
            <p className="max-w-lg text-base text-black/65">
              Use the same admin password configured in `ADMIN_PASSWORD` to unlock the ops dashboard, manage API keys,
              schedule runs, seed the 50-agent fleet, and export OpenClaw-ready configs.
            </p>
          </div>
        </div>

        <Panel title="Admin Access">
          <LoginForm />
        </Panel>
      </div>
    </main>
  );
}
