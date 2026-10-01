import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";

// Use the bundler already supplied by Vitest/Vite; no app server or Daily room needed.
const require = createRequire(import.meta.url);
const viteRequire = createRequire(require.resolve("vitest/package.json"));
const bundlerRequire = createRequire(viteRequire.resolve("vite/package.json"));
const { build } = bundlerRequire("esbuild") as {
  build: (options: Record<string, unknown>) => Promise<{ outputFiles: { text: string }[] }>;
};

test("instructor attaches an existing participant track when it becomes playable and after camera toggles", async ({
  page,
}) => {
  const bundle = await build({
    stdin: {
      contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { InstructorView } from './src/components/video/video-room';
        const canvas = document.createElement('canvas');
        canvas.width = 320; canvas.height = 180;
        canvas.getContext('2d').fillRect(0, 0, 320, 180);
        const track = canvas.captureStream(1).getVideoTracks()[0];
        const guest = { id:'guest', userId:'guest', name:'Test attendee', initials:'TA',
          isLocal:false, isInstructor:false, isMuted:true, isCameraOn:false,
          audioTrack:null, videoTrack:track };
        function App() {
          const [on, setOn] = React.useState(false);
          return <><button onClick={() => setOn(!on)}>Toggle camera</button>
            <InstructorView instructor={null} participants={[{...guest, isCameraOn:on}]}
              communityMode={false} considerations={[]} onMute={() => {}} onRemove={() => {}} />
          </>;
        }
        createRoot(document.getElementById('root')).render(<App />);
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
        name: "mock-auth",
        setup(plugin: {
          onResolve: (options: { filter: RegExp }, handler: () => object) => void;
          onLoad: (options: { filter: RegExp; namespace: string }, handler: () => object) => void;
        }) {
          plugin.onResolve({ filter: /auth-context$/ }, () => ({
            path: "auth",
            namespace: "mock-auth",
          }));
          plugin.onLoad({ filter: /.*/, namespace: "mock-auth" }, () => ({
            contents: "export const useAuth = () => ({user:null});",
            loader: "js",
          }));
        },
      },
    ],
  });
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await expect(page.getByText("Test attendee")).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  // Let the initial effect run while Daily's persistent track is not playable.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.getByRole("button", { name: "Toggle camera" }).click();
    await expect(page.locator("video")).toHaveCount(1);
    await expect
      .poll(() =>
        page
          .locator("video")
          .evaluate(
            (video: HTMLVideoElement) =>
              video.srcObject instanceof MediaStream &&
              video.srcObject.getVideoTracks().length === 1
          )
      )
      .toBe(true);
    await page.getByRole("button", { name: "Toggle camera" }).click();
    await expect(page.locator("video")).toHaveCount(0);
  }
});
