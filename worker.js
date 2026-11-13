// Display Reader CORS proxy (Cloudflare Worker, no dependencies).
//
// Why: browsers block direct calls from the glasses web app to the Readwise
// API (readwise.io sends no CORS headers), and most RSS feeds also lack CORS
// headers. This tiny Worker runs on your own Cloudflare account and adds the
// headers, so your Readwise token only ever goes to Readwise and to your own
// Worker. Never point the app at a public third-party CORS proxy with a token.
//
// Deploy: `npx wrangler deploy` in this directory (wrangler.toml included),
// or paste this file into a new Worker in the Cloudflare dashboard.
// Optional: set a shared secret with `wrangler secret put PROXY_SECRET` and
// enter the same value as the Proxy key in the app's Settings. When set, every
// request must carry it as an X-Proxy-Key header or ?key= parameter.
//
// Routes:
//   /readwise/<path>?<query>  -> https://readwise.io/api/v3/<path>?<query>
//   /fetch?url=<encoded URL>  -> fetches that URL (RSS feeds), CORS-enabled

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Proxy-Key",
  "Access-Control-Max-Age": "86400",
};

function cors(response, status) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(response.body, { status: status || response.status, headers });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    const secret = env.PROXY_SECRET;
    if (secret) {
      const key = request.headers.get("X-Proxy-Key") || url.searchParams.get("key");
      if (key !== secret) {
        return cors(new Response("Forbidden", { status: 403 }), 403);
      }
    }

    if (url.pathname === "/fetch") {
      const target = url.searchParams.get("url");
      if (!target) {
        return cors(new Response("Missing url parameter", { status: 400 }), 400);
      }
      let targetUrl;
      try {
        targetUrl = new URL(target);
      } catch {
        return cors(new Response("Invalid url", { status: 400 }), 400);
      }
      if (targetUrl.protocol !== "https:" && targetUrl.protocol !== "http:") {
        return cors(new Response("Only http(s) URLs are allowed", { status: 400 }), 400);
      }
      const upstream = await fetch(targetUrl.toString(), {
        headers: { "User-Agent": "DisplayReader/1.0" },
      });
      return cors(upstream);
    }

    if (url.pathname.startsWith("/readwise/")) {
      const path = url.pathname.slice("/readwise/".length);
      const upstreamUrl = "https://readwise.io/api/v3/" + path + url.search;
      const headers = new Headers();
      const auth = request.headers.get("Authorization");
      if (auth) headers.set("Authorization", auth);
      const contentType = request.headers.get("Content-Type");
      if (contentType) headers.set("Content-Type", contentType);
      const upstream = await fetch(upstreamUrl, {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method)
          ? undefined
          : await request.arrayBuffer(),
      });
      return cors(upstream);
    }

    return cors(new Response("Display Reader proxy is running.", { status: 200 }), 200);
  },
};
