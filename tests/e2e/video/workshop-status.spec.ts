import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const viteRequire = createRequire(require.resolve("vitest/package.json"));
const bundlerRequire = createRequire(viteRequire.resolve("vite/package.json"));
const { build } = bundlerRequire("esbuild") as {
  build: (options: Record<string, unknown>) => Promise<{ outputFiles: { text: string }[] }>;
};

test("attendee waits for explicit start and host refreshes lifecycle status", async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  const bundle = await build({
    stdin: {
      contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { DashboardRetreatLive } from './src/views/dashboard/retreat-live';
        import { DashboardRetreatHostLive } from './src/views/dashboard/retreat-host-live';
        const snapshot = {bookingId:'booking',retreatDateId:'date',title:'Test workshop',
          startsAt:new Date().toISOString(), endsAt:new Date(Date.now()+3600000).toISOString(),
          timezone:'Europe/London',capacity:4,state:'pre_join',roomState:'prepared',displayMode:'gallery',
          defaultMicMuted:true,defaultCameraOff:true,chatEnabled:true};
        let state = snapshot;
        window.fetch = async () => ({ok:true,json:async () => state});
        window.changeStatus = (roomState) => {state = {...snapshot,roomState,state:roomState==='ended'?'ended':'live'}; window.dispatchEvent(new Event('focus'));};
        function App() {
          const [host,setHost]=React.useState(false);
          return <><button onClick={()=>setHost(true)}>Switch to host</button>
            {host ? <DashboardRetreatHostLive initialData={snapshot} /> : <DashboardRetreatLive initialData={snapshot} />}</>;
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
    define: { "process.env.NODE_ENV": '"test"' },
    plugins: [
      {
        name: "view-dependencies",
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
          const mocks: Record<string, string> = {
            "next/link":
              "import React from 'react'; export default ({children,href})=><a href={href}>{children}</a>;",
            "next/navigation": "export const useRouter=()=>({push(){},refresh(){}});",
            "@/components/dashboard-layout": "export const DashboardLayout=({children})=>children;",
            "@/components/video/local-media-preview": "export const LocalMediaPreview=()=>null;",
            "@/components/video/pre-join-lobby":
              "import React from 'react'; export const PreJoinLobby=({onJoin})=><button onClick={()=>onJoin({isMuted:true,isCameraOn:false})}>Join workshop</button>;",
            "@/components/video/video-room":
              "import React from 'react'; export const VideoRoom=({onStartSession,initialMuted,initialCameraOn})=><section><h2>Live video room</h2><p>{String(initialMuted)}:{String(initialCameraOn)}</p>{onStartSession&&<button onClick={onStartSession}>Start workshop</button>}</section>;",
          };
          plugin.onResolve(
            {
              filter:
                /^(next\/(navigation|link)|@\/components\/(dashboard-layout|video\/(local-media-preview|pre-join-lobby|video-room)))$/,
            },
            ({ path }) => ({ path, namespace: "mock" })
          );
          plugin.onLoad({ filter: /.*/, namespace: "mock" }, ({ path }) => ({
            contents: mocks[path],
            loader: "tsx",
            resolveDir: process.cwd(),
          }));
        },
      },
    ],
  });
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.getByRole("button", { name: "Join workshop" }).click();
  await expect(
    page.getByRole("heading", { name: "Waiting for the workshop to start" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live video room" })).toHaveCount(0);
  await page.evaluate(() =>
    (window as unknown as { changeStatus: (state: string) => void }).changeStatus("started")
  );
  await expect(page.getByRole("heading", { name: "Live video room" })).toBeVisible();
  await expect(page.getByText("true:false", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Switch to host" }).click();
  await expect(page.getByRole("button", { name: "Start workshop" })).toHaveCount(0);
  await page.evaluate(() =>
    (window as unknown as { changeStatus: (state: string) => void }).changeStatus("ended")
  );
  await expect(page.getByRole("heading", { name: "Session ended" })).toBeVisible();
});
