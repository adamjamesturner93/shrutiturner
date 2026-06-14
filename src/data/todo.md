1. update stripe api version to 2026.05.27.dahlia
2. what webhooks do I need to connect to using the latest sdk - https://docs.stripe.com/connect/webhooks
3. confirm what the production stipe webhook endpoint is
4. confirm what the production contentful webhook endpoint is
5. should the table platformSetting be empty?
6. update Next.js 16.2.1 and any other versions of libraries/api dependencies

7. fix Cache (node:29651) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
   In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions. 8. fix prisma:error
Invalid `__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].platformSetting.upsert()` invocation in
/Users/adam/Desktop/Strength and Yoga Coaching/.next/dev/server/chunks/[root-of-the-server]\__07ji4-n._.js:293:165

290 };
291 }
292 async function getPlatformSettings() {
→ 293 const settings = await **TURBOPACK**imported**module**$5b$project$5d2f$src$2f$lib$2f$db$2e$ts**$5b$app$2d$route$5d$**$28$ecmascript$29$**["db"].platformSetting.upsert(
Unique constraint failed on the fields: (`id`)
[api] {
path: '/api/admin/business/settings',
requestId: 'f14e5b9d-56b9-47ab-b9d0-d1220e2ec037',
userId: 'cmnnbyzm70000jxoh8nka2cyf',
error: '\n' +
'Invalid `**TURBOPACK**imported**module**$5b$project$5d2f$src$2f$lib$2f$db$2e$ts**$5b$app$2d$route$5d$**$28$ecmascript$29$**["db"].platformSetting.upsert()` invocation in\n' +
    '/Users/adam/Desktop/Strength and Yoga Coaching/.next/dev/server/chunks/[root-of-the-server]__07ji4-n._.js:293:165\n' +
    '\n' +
    '  290     };\n' +
    '  291 }\n' +
    '  292 async function getPlatformSettings() {\n' +
    '→ 293     const settings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].platformSetting.upsert(\n' +
    'Unique constraint failed on the fields: (`id`)',
  stack: 'PrismaClientKnownRequestError: \n' +
    'Invalid `**TURBOPACK**imported**module**$5b$project$5d2f$src$2f$lib$2f$db$2e$ts**$5b$app$2d$route$5d$**$28$ecmascript$29$**["db"].platformSetting.upsert()` invocation in\n' +
'/Users/adam/Desktop/Strength and Yoga Coaching/.next/dev/server/chunks/[root-of-the-server]**07ji4-n._.js:293:165\n' +
'\n' +
' 290 };\n' +
' 291 }\n' +
' 292 async function getPlatformSettings() {\n' +
'→ 293 const settings = await **TURBOPACK**imported**module**$5b$project$5d2f$src$2f$lib$2f$db$2e$ts**$5b$app$2d$route$5d$**$28$ecmascript$29$\_\_["db"].platformSetting.upsert(\n' +
'Unique constraint failed on the fields: (`id`)\n' +
' at Gr.handleRequestError (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/@prisma+client@7.6.0_prisma@7.6.0_@types+react-dom@19.2.3_@types+react@19.2.14__@types+_52eca79d831808847f7df451b475b284/node_modules/@prisma/client/runtime/client.js:65:8286)\n' +
' at Gr.handleAndLogRequestError (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/@prisma+client@7.6.0_prisma@7.6.0_@types+react-dom@19.2.3_@types+react@19.2.14__@types+_52eca79d831808847f7df451b475b284/node_modules/@prisma/client/runtime/client.js:65:7581)\n' +
' at Gr.request (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/@prisma+client@7.6.0_prisma@7.6.0_@types+react-dom@19.2.3_@types+react@19.2.14__@types+_52eca79d831808847f7df451b475b284/node_modules/@prisma/client/runtime/client.js:65:7288)\n' +
' at process.processTicksAndRejections (node:internal/process/task_queues:104:5)\n' +
' at async a (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/@prisma+client@7.6.0_prisma@7.6.0_@types+react-dom@19.2.3_@types+react@19.2.14__@types+_52eca79d831808847f7df451b475b284/node_modules/@prisma/client/runtime/client.js:75:6730)\n' +
' at async getPlatformSettings (/Users/adam/Desktop/Strength and Yoga Coaching/.next/dev/server/chunks/[root-of-the-server]\_\_07ji4-n._.js:293:22)\n' +
' at async GET.auth (/Users/adam/Desktop/Strength and Yoga Coaching/.next/dev/server/chunks/[root-of-the-server]**07ji4-n.\_.js:2279:22)\n' +
' at async routeHandler (/Users/adam/Desktop/Strength and Yoga Coaching/.next/dev/server/chunks/[root-of-the-server]**0437.pd._.js:572:30)\n' +
' at async AppRouteRouteModule.do (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1_@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js:5:40732)\n' +
' at async AppRouteRouteModule.handle (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js:5:47861)\n' +
' at async responseGenerator (/Users/adam/Desktop/Strength and Yoga Coaching/.next/dev/server/chunks/0-51_next_dist_esm_0ibbra4.*.js:8414:38)\n' +
' at async AppRouteRouteModule.handleResponse (/Users/adam/Desktop/Strength and Yoga Coaching/node*modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js:1:227216)\n' +
' at async handleResponse (/Users/adam/Desktop/Strength and Yoga Coaching/.next/dev/server/chunks/0-51_next_dist_esm_0ibbra4.*.js:8477:32)\n' +
' at async Module.handler (/Users/adam/Desktop/Strength and Yoga Coaching/.next/dev/server/chunks/0-51*next_dist_esm_0ibbra4.*.js:8531:13)\n' +
' at async DevServer.renderToResponseWithComponentsImpl (/Users/adam/Desktop/Strength and Yoga Coaching/node*modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/server/base-server.js:1454:9)\n' +
' at async DevServer.renderPageComponent (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/server/base-server.js:1506:24)\n' +
' at async DevServer.renderToResponseImpl (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/server/base-server.js:1556:32)\n' +
' at async DevServer.pipeImpl (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/server/base-server.js:1043:25)\n' +
' at async NextNodeServer.handleCatchallRenderRequest (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/server/next-server.js:338:17)\n' +
' at async DevServer.handleRequestImpl (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/server/base-server.js:934:17)\n' +
' at async /Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/server/dev/next-dev-server.js:394:20\n' +
' at async Span.traceAsyncFn (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/trace/trace.js:164:20)\n' +
' at async DevServer.handleRequest (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/server/dev/next-dev-server.js:390:24)\n' +
' at async invokeRender (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/server/lib/router-server.js:253:21)\n' +
' at async handleRequest (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/server/lib/router-server.js:452:24)\n' +
' at async requestHandlerImpl (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node*modules/next/dist/server/lib/router-server.js:501:13)\n' +
' at async Server.requestListener (/Users/adam/Desktop/Strength and Yoga Coaching/node_modules/.pnpm/next@16.2.1*@babel+core@7.29.0_@opentelemetry+api@1.9.0_@playwright+test@1.58.2_react-d_8f1be9cd4cb05bc7f586cf5a0e11bc11/node_modules/next/dist/server/lib/start-server.js:225:13)'
}
GET /api/admin/business/settings 500 in 264ms (next.js: 5ms, application-code: 260ms)

9. Vercel build error:
   15:47:52.503 Running build in Washington, D.C., USA (East) – iad1
   15:47:52.504 Build machine configuration: 2 cores, 8 GB
   15:47:52.518 Cloning github.com/adamjamesturner93/shrutiturner (Branch: dev, Commit: 2503560)
   15:47:52.519 Skipping build cache, deployment was triggered without cache.
   15:47:53.516 Cloning completed: 998.000ms
   15:47:54.118 Running "vercel build"
   15:47:54.135 Vercel CLI 54.12.2
   15:47:54.605 Detected `pnpm-lock.yaml` version 9 generated by pnpm@10.x with package.json#packageManager pnpm@11.6.0
   15:47:54.650 Installing dependencies...
   15:47:57.295 ? Verifying lockfile against supply-chain policies (1120 entries)...
   15:48:05.763 ✓ Lockfile passes supply-chain policies (1120 entries in 8.4s)
   15:48:05.767 Lockfile is up to date, resolution step is skipped
   15:48:05.842 Progress: resolved 1, reused 0, downloaded 0, added 0
   15:48:05.930 Packages: +1003
   15:48:05.931 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   15:48:06.844 Progress: resolved 1003, reused 0, downloaded 43, added 0
   15:48:07.845 Progress: resolved 1003, reused 0, downloaded 62, added 0
   15:48:08.846 Progress: resolved 1003, reused 0, downloaded 88, added 4
   15:48:09.846 Progress: resolved 1003, reused 0, downloaded 169, added 8
   15:48:10.965 Progress: resolved 1003, reused 0, downloaded 170, added 8
   15:48:11.999 Progress: resolved 1003, reused 0, downloaded 278, added 16
   15:48:12.986 Progress: resolved 1003, reused 0, downloaded 326, added 20
   15:48:13.989 Progress: resolved 1003, reused 0, downloaded 342, added 20
   15:48:14.989 Progress: resolved 1003, reused 0, downloaded 365, added 22
   15:48:15.989 Progress: resolved 1003, reused 0, downloaded 388, added 24
   15:48:16.990 Progress: resolved 1003, reused 0, downloaded 515, added 32
   15:48:17.992 Progress: resolved 1003, reused 0, downloaded 714, added 44
   15:48:18.992 Progress: resolved 1003, reused 0, downloaded 818, added 52
   15:48:20.019 Progress: resolved 1003, reused 0, downloaded 918, added 60
   15:48:21.005 Progress: resolved 1003, reused 0, downloaded 1002, added 168
   15:48:22.006 Progress: resolved 1003, reused 0, downloaded 1002, added 169
   15:48:23.006 Progress: resolved 1003, reused 0, downloaded 1002, added 264
   15:48:24.009 Progress: resolved 1003, reused 0, downloaded 1002, added 342
   15:48:25.009 Progress: resolved 1003, reused 0, downloaded 1002, added 412
   15:48:26.010 Progress: resolved 1003, reused 0, downloaded 1002, added 644
   15:48:27.010 Progress: resolved 1003, reused 0, downloaded 1002, added 786
   15:48:28.011 Progress: resolved 1003, reused 0, downloaded 1002, added 927
   15:48:28.524 Progress: resolved 1003, reused 0, downloaded 1002, added 1003, done
   15:48:28.966 .../node*modules/@prisma/engines postinstall$ node scripts/postinstall.js
   15:48:28.985 .../node_modules/unrs-resolver postinstall$ napi-postinstall unrs-resolver 1.11.1 check
   15:48:29.007 .../sharp@0.34.5/node_modules/sharp install$ node install/check.js || npm run build
   15:48:29.028 .../esbuild@0.27.3/node_modules/esbuild postinstall$ node install.js
   15:48:29.153 .../node_modules/unrs-resolver postinstall: Done
   15:48:29.229 .../esbuild@0.27.3/node_modules/esbuild postinstall: Done
   15:48:29.310 .../sharp@0.34.5/node_modules/sharp install: Done
   15:48:29.712 .../node_modules/@prisma/engines postinstall: Done
   15:48:29.774 .../node_modules/prisma preinstall$ node scripts/preinstall-entry.js
   15:48:29.867 .../node_modules/prisma preinstall: Done
   15:48:30.354
   15:48:30.355 dependencies:
   15:48:30.355 + @auth/prisma-adapter 2.11.1
   15:48:30.355 + @emotion/react 11.14.0
   15:48:30.355 + @emotion/styled 11.14.1
   15:48:30.355 + @mui/icons-material 7.3.9
   15:48:30.355 + @mui/material 7.3.9
   15:48:30.355 + @popperjs/core 2.11.8
   15:48:30.355 + @prisma/adapter-pg 7.6.0
   15:48:30.356 + @prisma/client 7.6.0
   15:48:30.356 + @radix-ui/react-accordion 1.2.12
   15:48:30.356 + @radix-ui/react-alert-dialog 1.1.15
   15:48:30.356 + @radix-ui/react-aspect-ratio 1.1.8
   15:48:30.356 + @radix-ui/react-avatar 1.1.11
   15:48:30.356 + @radix-ui/react-checkbox 1.3.3
   15:48:30.356 + @radix-ui/react-collapsible 1.1.12
   15:48:30.356 + @radix-ui/react-context-menu 2.2.16
   15:48:30.356 + @radix-ui/react-dialog 1.1.15
   15:48:30.356 + @radix-ui/react-dropdown-menu 2.1.16
   15:48:30.356 + @radix-ui/react-hover-card 1.1.15
   15:48:30.357 + @radix-ui/react-label 2.1.8
   15:48:30.357 + @radix-ui/react-menubar 1.1.16
   15:48:30.357 + @radix-ui/react-navigation-menu 1.2.14
   15:48:30.357 + @radix-ui/react-popover 1.1.15
   15:48:30.357 + @radix-ui/react-progress 1.1.8
   15:48:30.357 + @radix-ui/react-radio-group 1.3.8
   15:48:30.357 + @radix-ui/react-scroll-area 1.2.10
   15:48:30.357 + @radix-ui/react-select 2.2.6
   15:48:30.357 + @radix-ui/react-separator 1.1.8
   15:48:30.358 + @radix-ui/react-slider 1.3.6
   15:48:30.358 + @radix-ui/react-slot 1.2.4
   15:48:30.358 + @radix-ui/react-switch 1.2.6
   15:48:30.358 + @radix-ui/react-tabs 1.1.13
   15:48:30.358 + @radix-ui/react-toggle 1.1.10
   15:48:30.358 + @radix-ui/react-toggle-group 1.1.11
   15:48:30.358 + @radix-ui/react-tooltip 1.2.8
   15:48:30.358 + @react-email/components 1.0.10
   15:48:30.360 + @react-email/render 2.0.4
   15:48:30.360 + class-variance-authority 0.7.1
   15:48:30.360 + clsx 2.1.1
   15:48:30.360 + cmdk 1.1.1
   15:48:30.360 + date-fns 3.6.0
   15:48:30.360 + embla-carousel-react 8.6.0
   15:48:30.360 + input-otp 1.4.2
   15:48:30.361 + lucide-react 0.487.0
   15:48:30.361 + motion 12.38.0
   15:48:30.361 + next 16.2.1
   15:48:30.362 + next-auth 5.0.0-beta.29
   15:48:30.363 + next-themes 0.4.6
   15:48:30.363 + pg 8.20.0
   15:48:30.363 + postmark 4.0.7
   15:48:30.363 + react 19.2.4
   15:48:30.363 + react-day-picker 8.10.1
   15:48:30.363 + react-dnd 16.0.1
   15:48:30.363 + react-dnd-html5-backend 16.0.1
   15:48:30.364 + react-dom 19.2.4
   15:48:30.364 + react-email 5.2.10
   15:48:30.364 + react-hook-form 7.72.0
   15:48:30.364 + react-popper 2.3.0
   15:48:30.364 + react-resizable-panels 2.1.7
   15:48:30.365 + react-responsive-masonry 2.7.1
   15:48:30.365 + react-slick 0.31.0
   15:48:30.365 + recharts 2.15.2
   15:48:30.365 + server-only 0.0.1
   15:48:30.366 + sonner 2.0.7
   15:48:30.366 + stripe 18.5.0
   15:48:30.366 + tailwind-merge 3.5.0
   15:48:30.366 + tw-animate-css 1.4.0
   15:48:30.366 + vaul 1.1.2
   15:48:30.367 + zod 4.3.6
   15:48:30.367
   15:48:30.367 devDependencies:
   15:48:30.367 + @axe-core/playwright 4.11.1
   15:48:30.368 + @eslint/eslintrc 3.3.5
   15:48:30.368 + @playwright/test 1.58.2
   15:48:30.368 + @tailwindcss/postcss 4.2.2
   15:48:30.368 + @types/node 22.19.13
   15:48:30.368 + @types/react 19.2.14
   15:48:30.369 + @types/react-dom 19.2.3
   15:48:30.369 + chrome-launcher 1.2.1
   15:48:30.369 + contentful-management 11.74.0
   15:48:30.369 + eslint 9.39.3
   15:48:30.369 + eslint-config-next 16.2.1
   15:48:30.369 + eslint-config-prettier 10.1.8
   15:48:30.369 + eslint-plugin-jsx-a11y 6.10.2
   15:48:30.370 + eslint-plugin-tailwindcss 4.0.0-beta.0
   15:48:30.370 + husky 9.1.7
   15:48:30.370 + lighthouse 13.0.3
   15:48:30.370 + lint-staged 16.4.0
   15:48:30.370 + prettier 3.8.1
   15:48:30.371 + prettier-plugin-tailwindcss 0.6.14
   15:48:30.371 + prisma 7.6.0
   15:48:30.371 + tailwindcss 4.2.2
   15:48:30.371 + typescript 5.9.3
   15:48:30.371 + vitest 4.1.0
   15:48:30.371
   15:48:30.426 . prepare$ husky
   15:48:30.489 . prepare: Done
   15:48:30.511 Done in 34s using pnpm v11.6.0
   15:48:30.629 Detected Next.js version: 16.2.1
   15:48:30.709 Running "pnpm run build"
   15:48:31.490 $ npx prisma generate
   15:48:33.068 Loaded Prisma config from prisma.config.ts.
   15:48:33.069
   15:48:33.270 Prisma schema loaded from prisma/schema.prisma.
   15:48:35.193
   15:48:35.194 ✔ Generated Prisma Client (v7.6.0) to ./node_modules/.pnpm/@prisma+client@7.6.0_prisma@7.6.0*@types+react-dom@19.2.3_@types+react@19.2.14__@types+\_52eca79d831808847f7df451b475b284/node_modules/@prisma/client in 1.19s
   15:48:35.194
   15:48:35.194 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
   15:48:35.194
   15:48:35.195
   15:48:35.252 $ next build
   15:48:35.887 Applying modifyConfig from Vercel
   15:48:35.895 Attention: Next.js now collects completely anonymous telemetry regarding usage.
   15:48:35.895 This information is used to shape Next.js' roadmap and prioritize features.
   15:48:35.895 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
   15:48:35.896 https://nextjs.org/telemetry
   15:48:35.901
   15:48:35.932 ▲ Next.js 16.2.1 (Turbopack)
   15:48:35.933 - Cache Components enabled
   15:48:35.934
   15:48:36.011 Creating an optimized production build ...
   15:49:14.493 ✓ Compiled successfully in 38.2s
   15:49:14.508 Running TypeScript ...
   15:49:42.274 Finished TypeScript in 27.8s ...
   15:49:42.295 Collecting page data using 1 worker ...
   15:49:44.769 Generating static pages using 1 worker (0/177) ...
   15:49:45.017 (node:707) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
   15:49:45.017 In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.
   15:49:45.018
   15:49:45.018 To prepare for this change:
   15:49:45.018 - If you want the current behavior, explicitly use 'sslmode=verify-full'
   15:49:45.019 - If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'
   15:49:45.019
   15:49:45.019 See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
   15:49:45.019 (Use `node --trace-warnings ...` to show where the warning was created)
   15:49:46.163 prisma:error
   15:49:46.163 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:46.164
   15:49:46.164
   15:49:46.164 The table `public.PlatformSetting` does not exist in the current database.
   15:49:46.338 ⨯ Error [PrismaClientKnownRequestError]:
   15:49:46.339 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:46.339
   15:49:46.340
   15:49:46.340 The table `public.PlatformSetting` does not exist in the current database.
   15:49:46.340 at async n (src/lib/platform/runtime-settings.ts:36:15)
   15:49:46.340 34 | "use cache";
   15:49:46.340 35 |
   15:49:46.341 > 36 | const row = await db.platformSetting.findUnique({
   15:49:46.341 | ^
   15:49:46.341 37 | where: { id: "default" },
   15:49:46.341 38 | select: {
   15:49:46.341 39 | businessName: true, {
   15:49:46.341 code: 'P2021',
   15:49:46.341 meta: {
   15:49:46.342 modelName: 'PlatformSetting',
   15:49:46.342 driverAdapterError: Error [DriverAdapterError]: TableDoesNotExist
   15:49:46.342 at ignore-listed frames {
   15:49:46.343 [cause]: [Object]
   15:49:46.343 }
   15:49:46.343 },
   15:49:46.343 clientVersion: '7.6.0',
   15:49:46.343 digest: '3064987408'
   15:49:46.343 }
   15:49:46.344 prisma:error
   15:49:46.344 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:46.344
   15:49:46.344
   15:49:46.344 The table `public.PlatformSetting` does not exist in the current database.
   15:49:46.465 ⨯ Error [PrismaClientKnownRequestError]:
   15:49:46.466 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:46.466
   15:49:46.466
   15:49:46.466 The table `public.PlatformSetting` does not exist in the current database.
   15:49:46.466 at async n (src/lib/platform/runtime-settings.ts:36:15)
   15:49:46.466 34 | "use cache";
   15:49:46.466 35 |
   15:49:46.466 > 36 | const row = await db.platformSetting.findUnique({
   15:49:46.466 | ^
   15:49:46.466 37 | where: { id: "default" },
   15:49:46.466 38 | select: {
   15:49:46.466 39 | businessName: true, {
   15:49:46.467 code: 'P2021',
   15:49:46.467 meta: {
   15:49:46.467 modelName: 'PlatformSetting',
   15:49:46.467 driverAdapterError: Error [DriverAdapterError]: TableDoesNotExist
   15:49:46.467 at ignore-listed frames {
   15:49:46.467 [cause]: [Object]
   15:49:46.467 }
   15:49:46.467 },
   15:49:46.467 clientVersion: '7.6.0',
   15:49:46.467 digest: '3064987408'
   15:49:46.467 }
   15:49:46.469 prisma:error
   15:49:46.470 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:46.470
   15:49:46.470
   15:49:46.470 The table `public.PlatformSetting` does not exist in the current database.
   15:49:46.564 ⨯ Error [PrismaClientKnownRequestError]:
   15:49:46.565 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:46.565
   15:49:46.565
   15:49:46.565 The table `public.PlatformSetting` does not exist in the current database.
   15:49:46.565 at async n (src/lib/platform/runtime-settings.ts:36:15)
   15:49:46.565 34 | "use cache";
   15:49:46.565 35 |
   15:49:46.565 > 36 | const row = await db.platformSetting.findUnique({
   15:49:46.566 | ^
   15:49:46.566 37 | where: { id: "default" },
   15:49:46.566 38 | select: {
   15:49:46.566 39 | businessName: true, {
   15:49:46.566 code: 'P2021',
   15:49:46.566 meta: {
   15:49:46.566 modelName: 'PlatformSetting',
   15:49:46.566 driverAdapterError: Error [DriverAdapterError]: TableDoesNotExist
   15:49:46.566 at ignore-listed frames {
   15:49:46.566 [cause]: [Object]
   15:49:46.566 }
   15:49:46.566 },
   15:49:46.566 clientVersion: '7.6.0',
   15:49:46.566 digest: '3064987408'
   15:49:46.567 }
   15:49:46.568 prisma:error
   15:49:46.568 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:46.568
   15:49:46.568
   15:49:46.569 The table `public.PlatformSetting` does not exist in the current database.
   15:49:46.695 ⨯ Error [PrismaClientKnownRequestError]:
   15:49:46.696 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:46.696
   15:49:46.696
   15:49:46.696 The table `public.PlatformSetting` does not exist in the current database.
   15:49:46.696 at async n (src/lib/platform/runtime-settings.ts:36:15)
   15:49:46.697 34 | "use cache";
   15:49:46.697 35 |
   15:49:46.697 > 36 | const row = await db.platformSetting.findUnique({
   15:49:46.697 | ^
   15:49:46.697 37 | where: { id: "default" },
   15:49:46.697 38 | select: {
   15:49:46.698 39 | businessName: true, {
   15:49:46.698 code: 'P2021',
   15:49:46.698 meta: {
   15:49:46.698 modelName: 'PlatformSetting',
   15:49:46.698 driverAdapterError: Error [DriverAdapterError]: TableDoesNotExist
   15:49:46.698 at ignore-listed frames {
   15:49:46.698 [cause]: [Object]
   15:49:46.698 }
   15:49:46.698 },
   15:49:46.699 clientVersion: '7.6.0',
   15:49:46.699 digest: '3064987408'
   15:49:46.699 }
   15:49:46.699 prisma:error
   15:49:46.699 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:46.699
   15:49:46.700
   15:49:46.700 The table `public.PlatformSetting` does not exist in the current database.
   15:49:46.788 ⨯ Error [PrismaClientKnownRequestError]:
   15:49:46.788 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:46.788
   15:49:46.789
   15:49:46.789 The table `public.PlatformSetting` does not exist in the current database.
   15:49:46.789 at async n (src/lib/platform/runtime-settings.ts:36:15)
   15:49:46.789 34 | "use cache";
   15:49:46.789 35 |
   15:49:46.790 > 36 | const row = await db.platformSetting.findUnique({
   15:49:46.790 | ^
   15:49:46.790 37 | where: { id: "default" },
   15:49:46.790 38 | select: {
   15:49:46.790 39 | businessName: true, {
   15:49:46.790 code: 'P2021',
   15:49:46.791 meta: {
   15:49:46.791 modelName: 'PlatformSetting',
   15:49:46.791 driverAdapterError: Error [DriverAdapterError]: TableDoesNotExist
   15:49:46.791 at ignore-listed frames {
   15:49:46.791 [cause]: [Object]
   15:49:46.791 }
   15:49:46.792 },
   15:49:46.792 clientVersion: '7.6.0',
   15:49:46.792 digest: '3064987408'
   15:49:46.792 }
   15:49:46.871 prisma:error
   15:49:46.872 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:46.872
   15:49:46.872
   15:49:46.872 The table `public.PlatformSetting` does not exist in the current database.
   15:49:46.959 ⨯ Error [PrismaClientKnownRequestError]:
   15:49:46.963 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:46.963
   15:49:46.963
   15:49:46.963 The table `public.PlatformSetting` does not exist in the current database.
   15:49:46.964 at async n (src/lib/platform/runtime-settings.ts:36:15)
   15:49:46.964 34 | "use cache";
   15:49:46.964 35 |
   15:49:46.964 > 36 | const row = await db.platformSetting.findUnique({
   15:49:46.966 | ^
   15:49:46.966 37 | where: { id: "default" },
   15:49:46.967 38 | select: {
   15:49:46.967 39 | businessName: true, {
   15:49:46.967 code: 'P2021',
   15:49:46.968 meta: {
   15:49:46.968 modelName: 'PlatformSetting',
   15:49:46.968 driverAdapterError: Error [DriverAdapterError]: TableDoesNotExist
   15:49:46.968 at ignore-listed frames {
   15:49:46.969 [cause]: [Object]
   15:49:46.969 }
   15:49:46.969 },
   15:49:46.970 clientVersion: '7.6.0',
   15:49:46.970 digest: '3064987408'
   15:49:46.976 }
   15:49:46.977 prisma:error
   15:49:46.977 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:46.977
   15:49:46.978
   15:49:46.978 The table `public.PlatformSetting` does not exist in the current database.
   15:49:47.055 ⨯ Error [PrismaClientKnownRequestError]:
   15:49:47.056 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:47.056
   15:49:47.056
   15:49:47.056 The table `public.PlatformSetting` does not exist in the current database.
   15:49:47.057 at async n (src/lib/platform/runtime-settings.ts:36:15)
   15:49:47.057 34 | "use cache";
   15:49:47.057 35 |
   15:49:47.057 > 36 | const row = await db.platformSetting.findUnique({
   15:49:47.057 | ^
   15:49:47.058 37 | where: { id: "default" },
   15:49:47.058 38 | select: {
   15:49:47.058 39 | businessName: true, {
   15:49:47.058 code: 'P2021',
   15:49:47.058 meta: {
   15:49:47.058 modelName: 'PlatformSetting',
   15:49:47.058 driverAdapterError: Error [DriverAdapterError]: TableDoesNotExist
   15:49:47.058 at ignore-listed frames {
   15:49:47.059 [cause]: [Object]
   15:49:47.059 }
   15:49:47.061 },
   15:49:47.061 clientVersion: '7.6.0',
   15:49:47.061 digest: '3064987408'
   15:49:47.062 }
   15:49:47.673 prisma:error
   15:49:47.673 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:47.674
   15:49:47.674
   15:49:47.674 The table `public.PlatformSetting` does not exist in the current database.
   15:49:47.763 ⨯ Error [PrismaClientKnownRequestError]:
   15:49:47.763 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:47.764
   15:49:47.764
   15:49:47.764 The table `public.PlatformSetting` does not exist in the current database.
   15:49:47.764 at async n (src/lib/platform/runtime-settings.ts:36:15)
   15:49:47.764 34 | "use cache";
   15:49:47.765 35 |
   15:49:47.765 > 36 | const row = await db.platformSetting.findUnique({
   15:49:47.765 | ^
   15:49:47.765 37 | where: { id: "default" },
   15:49:47.765 38 | select: {
   15:49:47.765 39 | businessName: true, {
   15:49:47.765 code: 'P2021',
   15:49:47.766 meta: {
   15:49:47.766 modelName: 'PlatformSetting',
   15:49:47.768 driverAdapterError: Error [DriverAdapterError]: TableDoesNotExist
   15:49:47.768 at ignore-listed frames {
   15:49:47.768 [cause]: [Object]
   15:49:47.769 }
   15:49:47.769 },
   15:49:47.769 clientVersion: '7.6.0',
   15:49:47.769 digest: '3064987408'
   15:49:47.769 }
   15:49:47.782 Error occurred prerendering page "/admin/classes". Read more: https://nextjs.org/docs/messages/prerender-error
   15:49:47.893 Error [PrismaClientKnownRequestError]:
   15:49:47.894 Invalid `prisma.platformSetting.findUnique()` invocation:
   15:49:47.894
   15:49:47.894
   15:49:47.894 The table `public.PlatformSetting` does not exist in the current database.
   15:49:47.895 at async n (src/lib/platform/runtime-settings.ts:36:15)
   15:49:47.895 34 | "use cache";
   15:49:47.895 35 |
   15:49:47.895 > 36 | const row = await db.platformSetting.findUnique({
   15:49:47.895 | ^
   15:49:47.895 37 | where: { id: "default" },
   15:49:47.896 38 | select: {
   15:49:47.896 39 | businessName: true, {
   15:49:47.896 code: 'P2021',
   15:49:47.896 meta: {
   15:49:47.896 modelName: 'PlatformSetting',
   15:49:47.896 driverAdapterError: Error [DriverAdapterError]: TableDoesNotExist
   15:49:47.897 at ignore-listed frames {
   15:49:47.897 [cause]: [Object]
   15:49:47.897 }
   15:49:47.897 },
   15:49:47.897 clientVersion: '7.6.0',
   15:49:47.898 digest: '3064987408'
   15:49:47.898 }
   15:49:47.898 Export encountered an error on /(app)/admin/classes/page: /admin/classes, exiting the build.
   15:49:47.960 ⨯ Next.js build worker exited with code: 1 and signal: null
   15:49:48.043 [ELIFECYCLE] Command failed with exit code 1.
   15:49:48.086 Error: Command "pnpm run build" exited with 1
