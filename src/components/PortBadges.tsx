import React from "react";
import { DataProvider, repeatedElement, useSelector } from "@plasmicapp/host";

interface Port {
  host: string;
  container: string;
  protocol: string;
  label: string; // e.g. "443" or "80→443"
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

interface PortBadgesProps {
  ports: string;
  children: React.ReactNode;
  className?: string;
}

export default function PortBadges({ ports, children, className }: PortBadgesProps) {
  const parsed = parsePorts(ports);
  return (
    <div className={className}>
      {parsed.map((port, i) => (
        <DataProvider key={i} name="port" data={port}>
          {repeatedElement(i, children)}
        </DataProvider>
      ))}
    </div>
  );
}

PortBadges.displayName = "PortBadges";
