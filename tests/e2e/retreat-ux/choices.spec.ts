import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const viteRequire = createRequire(require.resolve("vitest/package.json"));
const bundlerRequire = createRequire(viteRequire.resolve("vite/package.json"));
const postcss = bundlerRequire("postcss") as (plugins: unknown[]) => {
  process: (css: string, options: { from: string }) => Promise<{ css: string }>;
};
const { build } = bundlerRequire("esbuild") as {
  build: (options: Record<string, unknown>) => Promise<{ outputFiles: { text: string }[] }>;
};

test("grouped room choices and curated quotes remain accessible", async ({ page }) => {
  const bundle = await build({
    stdin: {
      contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { RetreatRoomChoices } from './src/components/retreat-room-choices';
        import { TestimonialPicker } from './src/components/admin/testimonial-picker';
        import { TestimonialQuotes } from './src/components/testimonial-quotes';
        const base = {description:'Test room', type:'shared_twin', bookingUnit:'bed_space', guestsIncluded:1, capacity:2, availableSpots:2, normalPricePence:45000, bathroomType:'private'};
        const rooms = [
          {...base,id:'twin',label:'Twin',bedSetup:'fixed_twin'},
          {...base,id:'convertible',label:'Convertible',bedSetup:'convertible_double_twin'},
          {...base,id:'private',label:'Private',bookingUnit:'whole_room',bedSetup:'fixed_double',normalPricePence:55000,ratePlans:[{guestCount:1,totalPricePence:55000},{guestCount:2,totalPricePence:90000}]},
          {...base,id:'sold-twin',label:'Private twin',bookingUnit:'whole_room',bedSetup:'fixed_twin',availableSpots:0,ratePlans:[{guestCount:1,totalPricePence:55000},{guestCount:2,totalPricePence:90000}]},
          {...base,id:'sold',label:'Sold out',bathroomType:'shared',availableSpots:0},
        ];
        const quotes = [1,2,3,4].map(n => ({id:String(n),quote:'Fixture quote '+n,authorName:'Test author '+n,contextLabel:'Previous workshop attendee'}));
        function App() {
          const [room,setRoom] = React.useState(null);
          const [ids,setIds] = React.useState([]);
          const [guests,setGuests] = React.useState(1);
          const [bed,setBed] = React.useState("double");
          return <main className="mx-auto max-w-3xl space-y-8 p-6 text-brand-dark">
            <h1>Choose your room</h1>
            <RetreatRoomChoices options={rooms} selectedId={room?.id || ''} currency="GBP" guestCount={guests} onGuestCountChange={setGuests} bedPreference={bed} onBedPreferenceChange={setBed} onSelect={setRoom}/>
            <output aria-label="Selected booking option">{room?.id || 'Choose a room'}</output>
            <TestimonialPicker available={quotes} selected={ids} onChange={setIds}/>
            <TestimonialQuotes testimonials={ids.map(id => quotes.find(q => q.id === id))}/>
          </main>;
        }
        createRoot(document.getElementById('root')).render(<App/>);
      `,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  await page.setContent(
    '<html lang="en"><head><title>Retreat choices</title></head><body><div id="root"></div></body></html>'
  );
  const css = await postcss([tailwindcss()]).process(readFileSync("src/styles/index.css", "utf8"), {
    from: path.resolve("src/styles/index.css"),
  });
  await page.addStyleTag({ content: css.css });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await expect(page.getByRole("region", { name: "What it’s like to join me" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Shared room · Shared bathroom/ })).toBeDisabled();
  const shared = page.getByRole("button", { name: /Shared room · Private bathroom/ });
  await shared.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Selected booking option")).toHaveText("twin");
  await expect(page.getByRole("button", { name: /Shared room · Shared bathroom/ })).toContainText(
    "Sold out"
  );
  await page.getByRole("button", { name: "2 people", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Shared room/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Private room · Private bathroom/ }).click();
  await expect(page.getByRole("button", { name: /Twin beds/ })).toContainText("Sold out");
  await expect(page.getByRole("button", { name: /Twin beds/ })).toBeDisabled();
  await page.getByRole("button", { name: "King bed", exact: true }).click();
  await expect(page.getByLabel("Selected booking option")).toHaveText("private");
  for (const n of [1, 2, 3])
    await page.getByRole("button", { name: "Add testimonial by Test author " + n }).click();
  await expect(
    page.getByRole("button", { name: "Add testimonial by Test author 4" })
  ).toBeDisabled();
  await page.getByRole("button", { name: "Move testimonial 3 up" }).click();
  const rendered = page.getByRole("region", { name: "What it’s like to join me" });
  await expect(rendered.locator("figcaption")).toHaveText([
    /Test author 1/,
    /Test author 3/,
    /Test author 2/,
  ]);
  await page.getByRole("button", { name: "Remove testimonial 2" }).click();
  await expect(rendered.locator("figure")).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.screenshot({ path: test.info().outputPath("retreat-choices.png"), fullPage: true });
});
