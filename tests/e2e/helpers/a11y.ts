import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

const staticRoutes = [
  "/",
  "/about",
  "/acceptable-use",
  "/blog",
  "/classes",
  "/classes/small-groups",
  "/classes/strength",
  "/classes/yoga",
  "/coaching",
  "/coaching-agreement",
  "/coaching/apply",
  "/coaching/personal-programme",
  "/contact",
  "/cookies",
  "/health-declaration",
  "/login",
  "/pricing",
  "/privacy",
  "/pt",
  "/refund-policy",
  "/retreats",
  "/schedule",
  "/signup",
  "/subscribe",
  "/terms",
  "/unsubscribe",
];

const skipPathPatterns = [
  /^\/api(?:\/|$)/,
  /^\/_next(?:\/|$)/,
  /^\/apple-icon(?:\/|$)/,
  /^\/gift\/redeem\//,
  /^\/icon(?:\/|$)/,
  /^\/favicon\.ico$/,
  /^\/r\//,
  /^\/retreats\/balance\//,
  /^\/classes\/small-groups\/[^/]+\/checkout$/,
  /^\/retreats\/[^/]+\/checkout$/,
];

type AxeViolationNode = {
  failureSummary: string | null;
  html: string;
  target: string[];
};

type AxeViolation = {
  description: string;
  help: string;
  helpUrl: string;
  id: string;
  impact: string | null;
  nodes: AxeViolationNode[];
};

function normalizeUrl(candidateUrl: string, baseUrl: string) {
  const parsed = new URL(candidateUrl, baseUrl);
  const baseOrigin = new URL(baseUrl).origin;

  if (parsed.origin !== baseOrigin) return null;

  parsed.hash = "";
  parsed.search = "";

  const pathname = parsed.pathname.replace(/\/$/, "") || "/";
  if (skipPathPatterns.some((pattern) => pattern.test(pathname))) {
    return null;
  }

  return pathname;
}

export async function discoverPublicRoutes(baseUrl: string) {
  const queue = [...staticRoutes];
  const seen = new Set<string>();
  const resolved: string[] = [];

  while (queue.length > 0) {
    const route = queue.shift();
    if (!route || seen.has(route)) continue;
    seen.add(route);

    const response = await fetch(new URL(route, baseUrl), {
      headers: {
        "user-agent": "playwright-axe-crawler",
      },
      redirect: "follow",
    });

    if (response.status >= 400) {
      continue;
    }

    const finalPath = normalizeUrl(response.url, baseUrl);
    if (!finalPath) {
      continue;
    }

    if (!resolved.includes(finalPath)) {
      resolved.push(finalPath);
    }

    const html = await response.text();
    const hrefMatches = [...html.matchAll(/href=["']([^"'#]+)["']/g)];

    for (const [, href] of hrefMatches) {
      if (!href) continue;
      const normalized = normalizeUrl(href, baseUrl);

      if (!normalized || seen.has(normalized) || queue.includes(normalized)) {
        continue;
      }

      queue.push(normalized);
    }
  }

  return resolved.sort((left, right) => left.localeCompare(right));
}

export async function waitForPageToSettle(page: Page) {
  await page.waitForLoadState("domcontentloaded");

  try {
    await page.waitForLoadState("networkidle", { timeout: 5_000 });
  } catch {
    // Some pages keep background requests alive; the audit still runs against the rendered DOM.
  }
}

export async function getAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"])
    .analyze();

  return results.violations.map((violation) => ({
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    id: violation.id,
    impact: violation.impact ?? null,
    nodes: violation.nodes.slice(0, 5).map((node) => ({
      failureSummary: node.failureSummary ?? null,
      html: node.html,
      target: node.target.map((selector) =>
        Array.isArray(selector) ? selector.map(String).join(" >> ") : String(selector)
      ),
    })),
  }));
}

export function formatAxeViolations(route: string, violations: AxeViolation[]) {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => {
          const target = node.target.length > 0 ? node.target.join(", ") : "(no selector)";
          const summary = node.failureSummary ?? "No failure summary provided.";
          return `${target}\n${summary}\n${node.html}`;
        })
        .join("\n\n");

      return [
        `Route: ${route}`,
        `${violation.id} (${violation.impact ?? "unknown impact"})`,
        violation.help,
        violation.description,
        violation.helpUrl,
        nodes,
      ].join("\n");
    })
    .join("\n\n");
}
