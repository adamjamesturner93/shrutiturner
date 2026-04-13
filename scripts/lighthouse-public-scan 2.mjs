import fs from "node:fs/promises";
import path from "node:path";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "@playwright/test";

const baseUrl = "http://127.0.0.1:3000";
const outputDir = "./test-results/lighthouse/public-scan";
const chromePath = chromium.executablePath();

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
  /^\/gift\/redeem\//,
  /^\/r\//,
  /^\/retreats\/balance\//,
  /^\/programmes\//,
  /^\/classes\/small-group\/[^/]+\/checkout$/,
  /^\/retreats\/[^/]+\/checkout$/,
];

function logProgress(message) {
  console.log(`[lighthouse] ${message}`);
}

function normalizeUrl(url) {
  const parsed = new URL(url, baseUrl);
  if (parsed.origin !== baseUrl) return null;
  parsed.hash = "";
  parsed.search = "";
  const pathname = parsed.pathname.replace(/\/$/, "") || "/";
  if (skipPathPatterns.some((pattern) => pattern.test(pathname))) return null;
  return pathname;
}

async function discoverRoutes() {
  const queue = [...staticRoutes];
  const seen = new Set();
  const resolved = [];
  const skipped = [];

  while (queue.length > 0) {
    const route = queue.shift();
    if (!route || seen.has(route)) continue;
    seen.add(route);

    try {
      const response = await fetch(new URL(route, baseUrl), {
        redirect: "follow",
        headers: {
          "user-agent": "codex-lighthouse-crawler",
        },
      });
      const status = response.status;
      const finalPath = normalizeUrl(response.url);

      if (!finalPath) {
        skipped.push({
          route,
          reason: "redirected_to_skipped_path",
          finalUrl: response.url,
          status,
        });
        continue;
      }

      if (status >= 400) {
        skipped.push({ route, reason: "http_error", finalUrl: response.url, status });
        continue;
      }

      if (!resolved.includes(finalPath)) resolved.push(finalPath);

      const html = await response.text();
      const hrefMatches = [...html.matchAll(/href=["']([^"'#]+)["']/g)];
      const links = hrefMatches.map((match) => match[1]).filter(Boolean);

      for (const href of links) {
        const normalized = normalizeUrl(href);
        if (normalized && !seen.has(normalized) && !queue.includes(normalized)) {
          queue.push(normalized);
        }
      }
    } catch (error) {
      skipped.push({
        route,
        reason: "navigation_failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  resolved.sort();
  skipped.sort((a, b) => a.route.localeCompare(b.route));
  return { resolved, skipped };
}

async function runLighthouseForUrl(url, preset) {
  const formFactor = preset === "mobile" ? "mobile" : "desktop";
  const screenEmulation =
    preset === "mobile"
      ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false }
      : { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false };

  const chrome = await launch({
    chromePath,
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      logLevel: "error",
      output: "json",
      onlyCategories: ["accessibility", "seo"],
      formFactor,
      screenEmulation,
      throttlingMethod: "provided",
    });

    if (!result?.lhr) throw new Error("Missing Lighthouse result");

    const { lhr } = result;
    const failingAudits = Object.values(lhr.audits)
      .filter(
        (audit) =>
          audit.scoreDisplayMode !== "notApplicable" && audit.scoreDisplayMode !== "informative"
      )
      .filter((audit) => audit.score !== null && audit.score < 1)
      .filter((audit) =>
        Object.entries(lhr.categories).some(
          ([categoryId, category]) =>
            (categoryId === "accessibility" || categoryId === "seo") &&
            category.auditRefs.some((ref) => ref.id === audit.id)
        )
      )
      .map((audit) => ({
        id: audit.id,
        title: audit.title,
        score: audit.score,
      }));

    return {
      url,
      preset,
      accessibility: lhr.categories.accessibility.score,
      seo: lhr.categories.seo.score,
      fetchTime: lhr.fetchTime,
      finalDisplayedUrl: lhr.finalDisplayedUrl,
      failingAudits,
      runnerError: lhr.runtimeError?.message ?? null,
      report: lhr,
    };
  } finally {
    await chrome.kill();
  }
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  logProgress(`Discovering public routes from ${baseUrl}`);
  const discovery = await discoverRoutes();
  const results = [];
  const failures = [];
  const totalRuns = discovery.resolved.length * 2;
  let currentRun = 0;

  logProgress(
    `Found ${discovery.resolved.length} routes to scan${discovery.skipped.length > 0 ? `, skipped ${discovery.skipped.length}` : ""}`
  );

  for (const route of discovery.resolved) {
    const url = new URL(route, baseUrl).toString();
    for (const preset of ["mobile", "desktop"]) {
      currentRun += 1;
      logProgress(`[${currentRun}/${totalRuns}] Scanning ${route} (${preset})`);
      try {
        const result = await runLighthouseForUrl(url, preset);
        results.push(result);
      } catch (error) {
        logProgress(
          `[${currentRun}/${totalRuns}] Failed ${route} (${preset}): ${error instanceof Error ? error.message : String(error)}`
        );
        failures.push({
          url,
          preset,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const summary = {
    scannedAt: new Date().toISOString(),
    baseUrl,
    chromePath,
    routesDiscovered: discovery.resolved,
    skippedRoutes: discovery.skipped,
    failures,
    results: results.map((item) => ({
      url: item.url,
      preset: item.preset,
      accessibility: item.accessibility,
      seo: item.seo,
      fetchTime: item.fetchTime,
      finalDisplayedUrl: item.finalDisplayedUrl,
      failingAudits: item.failingAudits,
      runnerError: item.runnerError,
    })),
  };

  await fs.writeFile(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2));
  await fs.writeFile(path.join(outputDir, "reports.json"), JSON.stringify(results, null, 2));

  const markdown = [];
  markdown.push("# Lighthouse Public Scan");
  markdown.push("");
  markdown.push(`Scanned routes: ${discovery.resolved.length}`);
  markdown.push(`Skipped routes: ${discovery.skipped.length}`);
  markdown.push(`Scan failures: ${failures.length}`);
  markdown.push("");
  markdown.push("| Route | Preset | Accessibility | SEO | Notes |");
  markdown.push("| --- | --- | ---: | ---: | --- |");

  for (const item of results) {
    const notes = item.failingAudits
      .slice(0, 4)
      .map((audit) => audit.id)
      .join(", ");
    markdown.push(
      `| ${new URL(item.url).pathname} | ${item.preset} | ${Math.round(item.accessibility * 100)} | ${Math.round(item.seo * 100)} | ${notes} |`
    );
  }

  if (discovery.skipped.length > 0) {
    markdown.push("");
    markdown.push("## Skipped");
    for (const item of discovery.skipped) {
      markdown.push(`- ${item.route}: ${item.reason}${item.status ? ` (${item.status})` : ""}`);
    }
  }

  if (failures.length > 0) {
    markdown.push("");
    markdown.push("## Failures");
    for (const item of failures) {
      markdown.push(`- ${new URL(item.url).pathname} (${item.preset}): ${item.error}`);
    }
  }

  await fs.writeFile(path.join(outputDir, "summary.md"), markdown.join("\n"));

  if (discovery.resolved.length === 0) {
    throw new Error(
      `No public routes were discovered at ${baseUrl}. Ensure the app is running and reachable before running Lighthouse.`
    );
  }

  console.log(
    JSON.stringify(
      {
        outputDir,
        scannedRoutes: discovery.resolved.length,
        skippedRoutes: discovery.skipped.length,
        failures: failures.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
