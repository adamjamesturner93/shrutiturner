function goneResponse() {
  return new Response("This content has been permanently removed.", {
    status: 410,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export function GET() {
  return goneResponse();
}

export function HEAD() {
  return new Response(null, { status: 410 });
}
