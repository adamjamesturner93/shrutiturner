// An inert same-origin document gives the isolated Google tag an HTTPS location.
// It contains no Google code. The parent injects the tag only after all consent,
// production-host and public-route checks pass.
export function GET() {
  return new Response(
    '<!doctype html><html><head><meta name="referrer" content="no-referrer"><title>Website analytics</title></head><body></body></html>',
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy": "frame-ancestors 'self'",
      },
    }
  );
}
