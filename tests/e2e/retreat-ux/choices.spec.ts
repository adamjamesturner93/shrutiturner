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
  await page.route("https://maps.google.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<html lang="en"><title>Map fixture</title><body>Map</body></html>',
    })
  );
  const bundle = await build({
    stdin: {
      contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { RetreatRoomChoices } from './src/components/retreat-room-choices';
        import { TestimonialQuotes } from './src/components/testimonial-quotes';
        import { RetreatSchedule } from './src/components/retreat-schedule';
        import { RetreatVenueMap } from './src/components/retreat-venue-map';
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
          const [showReviews,setShowReviews] = React.useState(false);
          const [guests,setGuests] = React.useState(1);
          const [bed,setBed] = React.useState("double");
          return <main className="mx-auto max-w-3xl space-y-8 p-6 text-brand-dark">
            <h1>Choose your room</h1>
            <RetreatRoomChoices options={rooms} selectedId={room?.id || ''} currency="GBP" guestCount={guests} onGuestCountChange={setGuests} bedPreference={bed} onBedPreferenceChange={setBed} onSelect={setRoom}/>
            <output aria-label="Selected booking option">{room?.id || 'Choose a room'}</output>
            <button onClick={() => setShowReviews(!showReviews)}>Toggle reviews</button>
            <TestimonialQuotes testimonials={showReviews ? quotes : []}/>
            <RetreatSchedule markdown={['## Friday — Unwind','- Arrive and settle in','## Saturday — Explore','- Morning movement'].join(String.fromCharCode(10))}/>
            <RetreatVenueMap venue={{name:"Powis House",slug:"powis",displayLocation:"Stirling",address:"Stirling, Scotland, FK9 5PS"}}/>
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
  await page.getByRole("button", { name: "Change room", exact: true }).click();
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
  await page.getByRole("button", { name: "Toggle reviews" }).click();
  const rendered = page.getByRole("region", { name: "What it’s like to join me" });
  await expect(rendered.locator("figure:not([aria-hidden])")).toHaveCount(4);
  await expect(rendered.locator("figcaption").first()).toContainText("Previous workshop attendee");
  const track = page.getByRole("region", { name: "Guest reviews" });
  await track.scrollIntoViewIfNeeded();
  await page.mouse.move(1, 1);
  const beforeMovement = await track.evaluate((node) => node.scrollLeft);
  await expect
    .poll(() => track.evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(beforeMovement + 2);
  await track.hover();
  const hoverPosition = await track.evaluate((node) => node.scrollLeft);
  await page.waitForTimeout(300);
  expect(Math.abs((await track.evaluate((node) => node.scrollLeft)) - hoverPosition)).toBeLessThan(
    2
  );
  const widthRatio = await track.evaluate(
    (node) => node.clientWidth / (node.firstElementChild as HTMLElement).offsetWidth
  );
  expect(widthRatio).toBeGreaterThan(1.1);
  expect(widthRatio).toBeLessThan(3);
  const friday = page.locator("summary").filter({ hasText: "Friday — Unwind" });
  await friday.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Arrive and settle in")).toBeVisible();
  await expect(page.getByText("Morning movement")).not.toBeVisible();
  await expect(page.getByRole("link", { name: /Get directions/ })).toHaveAttribute(
    "href",
    /Powis%20House.*FK9%205PS/
  );
  await expect(page.getByTitle("Map showing Powis House")).toHaveAttribute("src", /FK9%205PS/);
  await page.getByRole("button", { name: "Pause reviews" }).click();
  await expect(page.getByRole("button", { name: "Play reviews" })).toBeVisible();
  await page.getByRole("button", { name: "Next review" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("button", { name: "Play reviews" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next review" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.screenshot({ path: test.info().outputPath("retreat-choices.png"), fullPage: true });
});
