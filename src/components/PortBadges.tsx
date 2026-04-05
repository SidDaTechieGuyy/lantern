import React from "react";
import { DataProvider } from "@plasmicapp/host";

interface Port {
  host: string;
  container: string;
  protocol: string;
  label: string;
}

interface PortBadgesProps {
  ports: string;
  children: React.ReactNode;
  className?: string;
}

function parsePorts(raw: string): Port[] {
  if (!raw || raw === "--") return [];
  return raw.split(",").map((entry) => {
    const protoSplit = entry.split("/");
    const protocol = protoSplit[1] ?? "tcp";
    const mapping = protoSplit[0];
    if (mapping.includes("->")) {
      const [host, container] = mapping.split("->");
      return { host, container, protocol, label: host === container ? host : `${host}→${container}` };
    }
    return { host: mapping, container: mapping, protocol, label: mapping };
  });
}

export default function PortBadges({ ports, children, className }: PortBadgesProps) {
  const parsed = parsePorts(ports);
  return (
    <DataProvider name="ports" data={parsed}>
      <div className={className ?? ""}>{children}</div>
    </DataProvider>
  );
}

PortBadges.displayName = "PortBadges";
