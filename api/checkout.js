// Verifies the signed-in user, saves the order in Supabase, then sends the Mailgun email.
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const naira = n => "₦" + Number(n).toLocaleString("en-NG");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { SUPABASE_URL: U, SUPABASE_ANON_KEY: A, SUPABASE_SERVICE_ROLE_KEY: S,
          MAILGUN_API_KEY: K, MAILGUN_DOMAIN: D, MAIL_FROM: F, MAILGUN_BASE_URL } = process.env;

  // 1. Who is this?
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const ur = await fetch(`${U}/auth/v1/user`, { headers: { apikey: A, Authorization: `Bearer ${token}` } });
  if (!ur.ok) return res.status(401).json({ error: "Please sign in again." });
  const user = await ur.json();

  // 2. Check the order
  const { items, name, phone, address } = req.body || {};
  if (!Array.isArray(items) || !items.length || !name || !phone || !address)
    return res.status(400).json({ error: "Missing order details." });
  const clean = items.map(i => ({ id: Number(i.id), name: String(i.name).slice(0, 100),
    price: Math.max(0, Number(i.price)), qty: Math.min(99, Math.max(1, parseInt(i.qty))) }));
  const total = clean.reduce((s, i) => s + i.price * i.qty, 0);

  // 3. Save in Supabase
  const ins = await fetch(`${U}/rest/v1/orders`, {
    method: "POST",
    headers: { apikey: S, Authorization: `Bearer ${S}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ user_id: user.id, email: user.email, name, phone, address, items: clean, total })
  });
  if (!ins.ok) return res.status(500).json({ error: "Could not save your order." });
  const [order] = await ins.json();

  // 4. Confirmation email (order stays saved even if this fails)
  let emailSent = false;
  try {
    const rows = clean.map(i => `<tr><td style="padding:8px 0;border-bottom:1px solid #e5e2d8">${esc(i.name)} × ${i.qty}</td><td style="padding:8px 0;border-bottom:1px solid #e5e2d8;text-align:right">${naira(i.price * i.qty)}</td></tr>`).join("");
    const html = `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#16231f">
<div style="background:#16231f;color:#f3efe3;padding:20px"><h2 style="margin:0">First Man Furniture</h2></div>
<div style="padding:20px;background:#fff"><h3>Thank you, ${esc(name)}. We have received your order.</h3>
<p style="font-family:Arial,sans-serif;font-size:14px">Order reference: <strong>${esc(String(order.id).slice(0, 8))}</strong></p>
<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows}
<tr><td style="padding:12px 0"><strong>Total</strong></td><td style="text-align:right"><strong>${naira(total)}</strong></td></tr></table>
<p style="font-family:Arial,sans-serif;font-size:14px"><strong>Delivery to:</strong><br>${esc(address)}<br>${esc(phone)}</p>
<p style="font-family:Arial,sans-serif;font-size:13px;color:#6a746d">We will call you to confirm delivery.</p></div></div>`;
    const body = new URLSearchParams({ from: F, to: user.email, subject: "Your First Man Furniture order", html });
    const mg = await fetch(`${MAILGUN_BASE_URL || "https://api.mailgun.net"}/v3/${D}/messages`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from("api:" + K).toString("base64") },
      body
    });
    emailSent = mg.ok;
  } catch (e) { /* ignore */ }

  res.status(200).json({ ok: true, orderId: order.id, emailSent });
};
