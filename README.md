# First Man Furniture

Static site (index.html) + 2 Vercel serverless functions (api/config.js, api/checkout.js).
Stack: Supabase (database + Google sign-in), Mailgun (email), Vercel (hosting).

## Setup
1. Supabase: create project, run supabase.sql in the SQL Editor.
2. Google Cloud Console: OAuth consent screen + OAuth Client ID (Web).
   Authorized redirect URI: https://YOUR-PROJECT.supabase.co/auth/v1/callback
3. Supabase > Authentication > Providers > Google: paste Client ID and Secret.
   Authentication > URL Configuration: Site URL = your Vercel link.
4. Mailgun: get API key and domain. With a sandbox domain, add your own email
   under "Authorized recipients" and confirm it.
5. Vercel: import the GitHub repo, add every variable from .env.example under
   Settings > Environment Variables, then Redeploy.
6. Test on the live link: sign in, order, check email, sign out, reopen, sign in, see orders.

## Notes
- Never commit real keys. .env.example holds placeholders only.
- Product list and prices are at the top of the script in index.html.
- Prices come from the browser. Before taking real money, move the product list to the server.
