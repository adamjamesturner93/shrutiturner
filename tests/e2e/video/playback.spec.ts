import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import { createRequire } from "node:module";

// Use the bundler already supplied by Vitest/Vite; no app server or Daily room needed.
const require = createRequire(import.meta.url);
const viteRequire = createRequire(require.resolve("vitest/package.json"));
const bundlerRequire = createRequire(viteRequire.resolve("vite/package.json"));
const postcss = bundlerRequire("postcss") as (plugins: unknown[]) => {
  process: (css: string, options: { from: string }) => Promise<{ css: string }>;
};
const { build } = bundlerRequire("esbuild") as {
  build: (options: Record<string, unknown>) => Promise<{ outputFiles: { text: string }[] }>;
};

test("workshop playback, layout, mute notification and disconnection", async ({ page }) => {
  const bundle = await build({
    stdin: {
      contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { InstructorView, ParticipantView, VideoRoom } from './src/components/video/video-room';
        const canvas = document.createElement('canvas');
        canvas.width = 320; canvas.height = 180;
        canvas.getContext('2d').fillRect(0, 0, 320, 180);
        const track = canvas.captureStream(1).getVideoTracks()[0];
        const guest = { id:'guest', userId:'guest', name:'Test attendee', initials:'TA',
          isLocal:false, isInstructor:false, isMuted:true, isCameraOn:false,
          audioTrack:null, videoTrack:track };
        const handlers = {};
        const local = {session_id:'local', user_id:'guest', user_name:'Test attendee', local:true, tracks:{}};
        const owner = {session_id:'host', user_id:'host', user_name:'Host', owner:true, tracks:{}};
        window.DailyIframe = {createCallObject: () => ({
          on: (name, handler) => { (handlers[name] ||= []).push(handler); }, off: () => {},
          join: async () => {}, leave: async () => {}, destroy: async () => {},
          participants: () => ({local, host:owner}), setLocalAudio: () => {}, setLocalVideo: () => {},
        })};
        window.fetch = async () => ({ok:true, json:async () => ({token:'test',roomUrl:'https://test.daily.co/test'})});
        window.emitCallEvent = (name, data) => (handlers[name] || []).forEach(fn => fn(data));
        function App() {
          const [live, setLive] = React.useState(false);
          const [on, setOn] = React.useState(false);
          const [gallery, setGallery] = React.useState(false);
          const [focus, setFocus] = React.useState(false);
          const [chat, setChat] = React.useState(true);
          const host = {...guest, id:'host', userId:'host', name:'Host', isInstructor:true, isCameraOn:true};
          if (live) return <VideoRoom sessionId="test" roomTokenEndpoint="/token" attendanceEndpoint={null} chatEndpoint={null} mode="retreat" isInstructor={false} className="Test workshop" classTime="Today" classDuration="1 hour" registeredCount={2} onLeave={() => setLive(false)} />;
          return <><button onClick={() => setLive(true)}>Test live lifecycle</button><button onClick={() => setGallery(true)}>Four attendees</button>
            <button onClick={() => setFocus(true)}>Participant focus</button>
            <button onClick={() => setChat(!chat)}>Toggle chat</button>
            <button onClick={() => setOn(!on)}>Toggle camera</button>
            {focus ? <div style={{display:'flex', height:500, width:'100%'}}>
              <ParticipantView instructor={host} selfParticipant={{...guest,isCameraOn:true}} participants={[]} showSelfView={true} communityMode={false} />
              {chat ? <aside style={{width:320,flexShrink:0}}>Chat</aside> : null}
            </div> : <InstructorView instructor={null} participants={gallery ? [1,2,3,4].map(id => ({...guest, id:String(id), name:'Guest '+id, isCameraOn:true})) : [{...guest, isCameraOn:on}]}
              communityMode={false} considerations={[]} onMute={() => {}} onRemove={() => {}} />}
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
  const css = await postcss([tailwindcss()]).process(readFileSync("src/styles/index.css", "utf8"), {
    from: path.resolve("src/styles/index.css"),
  });
  await page.addStyleTag({ content: css.css });
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
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.getByRole("button", { name: "Four attendees" }).click();
  const tiles = page.locator('[aria-label="Workshop participants"] > div');
  await expect(tiles).toHaveCount(4);
  const boxes = await tiles.evaluateAll((elements) =>
    elements.map((element) => {
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    })
  );
  expect(boxes[0].y).toBe(boxes[1].y);
  expect(boxes[2].y).toBeGreaterThan(boxes[0].y);
  for (const box of boxes) expect(box.width / box.height).toBeCloseTo(16 / 9, 1);
  await page.getByRole("button", { name: "Participant focus" }).click();
  for (let i = 0; i < 2; i++) {
    const selfVideo = page.locator("video").last();
    await expect(selfVideo).toBeInViewport({ ratio: 1 });
    await page.getByRole("button", { name: "Toggle chat" }).click();
  }
  await page.getByRole("button", { name: "Test live lifecycle" }).click();
  await expect(page.getByRole("button", { name: "Leave" })).toBeVisible();
  await page.evaluate(() => {
    const emit = (window as unknown as { emitCallEvent: (name: string, data?: unknown) => void })
      .emitCallEvent;
    emit("app-message", {
      fromId: "host",
      data: { type: "moderation", action: "mute", targetUserId: "guest" },
    });
  });
  await expect(page.getByRole("status")).toContainText(
    "Your instructor has muted your microphone."
  );
  await page.getByRole("button", { name: "Dismiss", exact: true }).click();
  await page.evaluate(() =>
    (window as unknown as { emitCallEvent: (name: string) => void }).emitCallEvent("left-meeting")
  );
  await expect(
    page.getByRole("heading", { name: "You’re no longer in the workshop" })
  ).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Clap", exact: true })).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Live chat" })).toHaveCount(0);
});
