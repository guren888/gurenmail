export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. Endpoint Config / Domains (Menyesuaikan mail.cx v1)
      if (url.pathname === "/api/config") {
        const res = await fetch("https://api.mail.cx/v1/domains", {
          headers: { "Accept": "application/json" }
        });
        const data = await res.json();
        return new Response(JSON.stringify({ domains: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 2. Endpoint Inbox
      if (url.pathname.startsWith("/api/inbox/")) {
        const email = url.pathname.replace("/api/inbox/", "");
        const targetUrl = `https://api.mail.cx/v1/inbox/${email}${url.search}`;
        
        if (request.method === "DELETE") {
          const res = await fetch(targetUrl, { method: "DELETE", headers: { "Accept": "application/json" } });
          return new Response(null, { status: res.status, headers: corsHeaders });
        }

        const res = await fetch(targetUrl, { headers: { "Accept": "application/json" } });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 3. Endpoint Baca Email
      if (url.pathname.startsWith("/api/email/")) {
        const id = url.pathname.replace("/api/email/", "");
        const res = await fetch(`https://api.mail.cx/v1/email/${id}`, {
          headers: { "Accept": "application/json" }
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return env.ASSETS.fetch(request);
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
