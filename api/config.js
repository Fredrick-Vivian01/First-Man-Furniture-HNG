// Sends the PUBLIC Supabase values to the browser (safe: anon key is meant to be public)
module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ url: process.env.SUPABASE_URL, anon: process.env.SUPABASE_ANON_KEY });
};
