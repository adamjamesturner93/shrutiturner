import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const viteRequire = createRequire(require.resolve("vitest/package.json"));
const bundlerRequire = createRequire(viteRequire.resolve("vite/package.json"));
const { build } = bundlerRequire("esbuild") as {
  build: (options: Record<string, unknown>) => Promise<{ outputFiles: { text: string }[] }>;
};

test("registration recovery preserves the invite through sign-out and handles failures", async ({
  page,
}) => {
  const bundle = await build({
    stdin: {
      contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {RetreatRegistrationAccess} from './src/views/dashboard/retreat-registration-access';
      createRoot(document.getElementById('root')).render(<main><RetreatRegistrationAccess attendeeId="guest-place"/></main>);
    `,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "auth-and-link",
        setup(plugin: {
          onResolve: (
            options: { filter: RegExp },
            handler: (args: { path: string }) => object
          ) => void;
          onLoad: (
            options: { filter: RegExp; namespace: string },
            handler: (args: { path: string }) => object
          ) => void;
        }) {
          plugin.onResolve({ filter: /^(next-auth\/react|next\/link)$/ }, (args) => ({
            path: args.path,
            namespace: "test",
          }));
          plugin.onLoad({ filter: /.*/, namespace: "test" }, (args) => ({
            loader: "jsx",
            resolveDir: process.cwd(),
            contents:
              args.path === "next/link"
                ? "import React from 'react'; export default function Link(props){return <a {...props}/>;}"
                : "export async function signOut(options){window.signOutOptions=options; if(!window.retried){window.retried=true;throw new Error('Offline');}}",
          }));
        },
      },
    ],
  });
  await page.setContent(
    '<html lang="en"><head><title>Registration</title></head><body><div id="root"></div></body></html>'
  );
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await expect(
    page.getByRole("heading", { name: "Sign in with your invitation email" })
  ).toBeVisible();
  const button = page.getByRole("button", { name: "Sign out and continue to registration" });
  await button.click();
  await expect(page.getByRole("alert")).toHaveText("We couldn’t sign you out. Please try again.");
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.getByRole("button", { name: "Signing out…" })).toBeDisabled();
  const options = await page.evaluate(
    () => (window as Window & { signOutOptions?: { redirectTo: string } }).signOutOptions
  );
  expect(options.redirectTo).toBe(
    "/login?redirect=%2Fdashboard%2Fretreats%2Fregistration%2Fguest-place"
  );
  expect(new URL(options.redirectTo, "https://example.com").searchParams.get("redirect")).toBe(
    "/dashboard/retreats/registration/guest-place"
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations
  ).toEqual([]);
});
