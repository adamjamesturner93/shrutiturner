import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = path.join(process.cwd(), "src/app");
const ROUTE_ENTRY_FILES = new Set(["page.tsx", "page.ts", "route.tsx", "route.ts"]);

function walkDirectories(rootDir: string): string[] {
  const directories = [rootDir];

  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    directories.push(...walkDirectories(path.join(rootDir, entry.name)));
  }

  return directories;
}

function isRouteDirectory(directory: string) {
  return readdirSync(directory).some((entry) => ROUTE_ENTRY_FILES.has(entry));
}

function normalizeSegment(segment: string) {
  if (segment.startsWith("(") && segment.endsWith(")")) return "";
  if (segment.startsWith("@")) return "";
  if (/^\[\[\.\.\.[^/]+\]\]$/.test(segment)) return "[[...]]";
  if (/^\[\.\.\.[^/]+\]$/.test(segment)) return "[...]";
  if (/^\[[^/]+\]$/.test(segment)) return "[]";
  return segment;
}

function getRouteDirectories() {
  return walkDirectories(APP_ROOT)
    .filter((directory) => statSync(directory).isDirectory() && isRouteDirectory(directory))
    .map((directory) => path.relative(APP_ROOT, directory))
    .sort();
}

describe("app router paths", () => {
  it("does not define conflicting normalized routes", () => {
    const normalizedRouteMap = new Map<string, Set<string>>();

    for (const routeDirectory of getRouteDirectories()) {
      const normalizedRoute = routeDirectory
        .split(path.sep)
        .map(normalizeSegment)
        .filter(Boolean)
        .join("/");

      const existingRoutes = normalizedRouteMap.get(normalizedRoute) ?? new Set<string>();
      existingRoutes.add(routeDirectory);
      normalizedRouteMap.set(normalizedRoute, existingRoutes);
    }

    const conflicts = [...normalizedRouteMap.entries()]
      .filter(([, routeDirectories]) => routeDirectories.size > 1)
      .map(
        ([normalizedRoute, routeDirectories]) =>
          `${normalizedRoute || "/"}: ${[...routeDirectories].join(", ")}`
      );

    expect(conflicts).toEqual([]);
  });
});
