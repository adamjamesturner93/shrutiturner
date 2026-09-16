import http from "node:http";
const sessions = new Map();
let counter = 0;
const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, "http://127.0.0.1:3799").pathname;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const form = new URLSearchParams(raw);
  const send = (body) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  };
  if (path === "/health") return send({ ok: true });
  if (path === "/v1/checkout/sessions" && req.method === "POST") {
    const id = `cs_test_rys_${++counter}`;
    const value = {
      id,
      object: "checkout.session",
      url: `http://127.0.0.1:3799/pay/${id}`,
      metadata: {
        kind: form.get("metadata[kind]"),
        enrolmentId: form.get("metadata[enrolmentId]"),
      },
      amount_total: Number(form.get("line_items[0][price_data][unit_amount]")),
      currency: "gbp",
      payment_status: "unpaid",
      status: "open",
      payment_intent: `pi_${id}`,
      success_url: form.get("success_url"),
    };
    sessions.set(id, value);
    return send(value);
  }
  if (path.startsWith("/pay/")) {
    const s = sessions.get(path.split("/").at(-1));
    if (!s) {
      res.statusCode = 404;
      return send({ error: "not found" });
    }
    if (req.method === "POST") {
      s.payment_status = "paid";
      s.status = "complete";
      res.writeHead(303, { Location: s.success_url.replace("{CHECKOUT_SESSION_ID}", s.id) });
      return res.end();
    }
    res.setHeader("Content-Type", "text/html");
    return res.end(
      '<!doctype html><html lang="en"><title>Stripe test checkout</title><main><h1>Stripe test checkout</h1><form method="post"><button>Pay synthetic purchase</button></form></main></html>'
    );
  }
  if (path.startsWith("/v1/checkout/sessions/"))
    return send(sessions.get(path.split("/").at(-1)) || { error: "not found" });
  if (path === "/v1/refunds") return send({ id: "re_test_rys", status: "succeeded" });
  if (path.endsWith("/access-link"))
    return send({ download_link: "http://127.0.0.1:3799/fixture.mp4", expires: 1900000000 });
  if (path === "/v1/rooms") {
    const body = JSON.parse(raw);
    return send({ name: body.name, url: `https://example.test/${body.name}` });
  }
  if (path === "/v1/meeting-tokens") return send({ token: "synthetic-authorised-token" });
  if (path.endsWith("/recordings/start")) return send({ id: "recording-test", room_name: "test" });
  if (path.endsWith("/recordings/stop")) return send({ id: "recording-test" });
  res.statusCode = 404;
  send({ error: "not found" });
});
server.listen(3799, "127.0.0.1");
