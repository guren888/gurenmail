const MAILCX = "https://api.mail.cx/v1";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function cors(response) {
  const h = new Headers(response.headers);
  h.set("access-control-allow-origin", "*");
  h.set("access-control-allow-methods", "GET,POST,DELETE,OPTIONS");
  h.set("access-control-allow-headers", "content-type");
  return new Response(response.body, {status: response.status, headers: h});
}

async function mailcx(path, env, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("x-api-token", env.MAILCX_API_TOKEN);
  headers.set("accept", "application/json");
  return fetch(MAILCX + path, {...init, headers});
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return cors(new Response(null, {status: 204}));
    }

    // Public Mail.cx configuration: used to show available system domains.
    if (url.pathname === "/api/config" && request.method === "GET") {
      const r = await fetch(`${MAILCX}/config`);
      return cors(new Response(r.body, {
        status: r.status,
        headers: {"content-type": r.headers.get("content-type") || "application/json"}
      }));
    }

    const inboxMatch = url.pathname.match(/^\/api\/inbox\/(.+)$/);
    if (inboxMatch) {
      const addr = decodeURIComponent(inboxMatch[1]);
      if (!addr.includes("@") || addr.length > 254) return cors(json({error:"invalid_address"},400));

      const qs = url.search;
      const r = await mailcx(`/inbox/${encodeURIComponent(addr)}${qs}`, env, {
        method: request.method
      });
      return cors(new Response(r.body, {
        status: r.status,
        headers: {"content-type": r.headers.get("content-type") || "application/json"}
      }));
    }

    const emailMatch = url.pathname.match(/^\/api\/email\/(.+)$/);
    if (emailMatch && request.method === "GET") {
      const id = decodeURIComponent(emailMatch[1]);
      const r = await mailcx(`/email/${encodeURIComponent(id)}`, env);
      return cors(new Response(r.body, {
        status: r.status,
        headers: {"content-type": r.headers.get("content-type") || "application/json"}
      }));
    }

    const rawMatch = url.pathname.match(/^\/api\/email\/(.+)\/raw$/);
    if (rawMatch && request.method === "GET") {
      const id = decodeURIComponent(rawMatch[1]);
      const r = await mailcx(`/email/${encodeURIComponent(id)}/raw`, env);
      return cors(new Response(r.body, {
        status: r.status,
        headers: {"content-type": r.headers.get("content-type") || "message/rfc822"}
      }));
    }

    // Static assets are served by the Worker assets binding.
    return env.ASSETS.fetch(request);
  }
};
