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
      // Endpoint API Mail.cx
      if (url.pathname === "/api/config") {
        const res = await fetch("https://api.mail.cx/api/v1/auth/domains", {
          headers: { "Accept": "application/json" }
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (url.pathname.startsWith("/api/inbox/")) {
        const email = url.pathname.replace("/api/inbox/", "");
        const res = await fetch(`https://api.mail.cx/api/v1/mailbox/${encodeURIComponent(email)}`, {
          headers: { "Accept": "application/json" }
        });
        const data = await res.json();
        return new Response(JSON.stringify({ emails: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (url.pathname.startsWith("/api/email/")) {
        const id = url.pathname.replace("/api/email/", "");
        const res = await fetch(`https://api.mail.cx/api/v1/mailbox/message/${encodeURIComponent(id)}`, {
          headers: { "Accept": "application/json" }
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Jika bukan route API, biarkan Cloudflare Pages memuat file statis (HTML/JS)
      return env.ASSETS.fetch(request);
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
