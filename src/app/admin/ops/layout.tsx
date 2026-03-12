import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { OPS_COLOR_TOKENS } from "@/lib/ops/constants";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-ops-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ops-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AgentPick Ops",
  description: "Operations backend for benchmark agent management.",
};

export default function OpsRootLayout(props: { children: React.ReactNode }) {
  return (
    <div
      className={`${dmSans.variable} ${ibmPlexMono.variable} min-h-screen`}
      style={{
        background: `radial-gradient(circle at top left, #fff8e5 0%, ${OPS_COLOR_TOKENS.background} 42%, #efe8d8 100%)`,
        color: OPS_COLOR_TOKENS.text,
        fontFamily: "var(--font-ops-sans)",
      }}
    >
      {props.children}
    </div>
  );
}
