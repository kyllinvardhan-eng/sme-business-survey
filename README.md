# SME Business Survey

A clean, professional survey platform to understand operational challenges facing small and medium businesses. Built on Netlify + Supabase.

## Features

- **5-minute survey** - 18 carefully crafted questions covering operations, systems, pain points, and willingness to pay
- **Responsive design** - Works on desktop, tablet, and mobile
- **WhatsApp distribution** - Native WhatsApp share buttons + admin tools for bulk sending
- **Response tracking** - See which responses came from WhatsApp vs organic
- **Admin dashboard** - Analytics, charts, opportunity ranking, and WhatsApp management
- **Data export** - Export all responses to CSV
- **Simple architecture** - Static frontend + serverless functions + managed database

## Setup

### Prerequisites

1. Netlify account (free)
2. Supabase account (free tier is sufficient)
3. GitHub account (for version control)

### Step 1: Create Supabase Database

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. In the SQL editor, run the query in [`supabase/schema.sql`](supabase/schema.sql). It creates the `survey_responses` table, enables Row Level Security, and adds a policy that lets the public `anon` key INSERT new responses only (no read access).

4. Get your Supabase credentials:
   - Go to Settings > API
   - Copy the `URL`, the `anon` `public` key, and the `service_role` `secret` key

### Step 2: Deploy to Netlify

1. Push this code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign up
3. Click "Add new site" > "Import an existing project"
4. Connect your GitHub account and select the repository
5. Click "Deploy site"

### Step 3: Configure Environment Variables

1. In Netlify, go to Site settings > Build & deploy > Environment
2. Add these variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase public API key (used by the survey submit function)
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (used server-side only, by the admin dashboard function, to read responses regardless of RLS)
   - `ADMIN_PASSWORD` - A strong password for dashboard access (choose this yourself)

3. Redeploy the site to apply the environment variables

### Step 4: Access Your Survey

- **Public survey**: `https://your-netlify-domain.com/`
- **Admin dashboard**: `https://your-netlify-domain.com/?admin=true`

Then login with the admin password you set.

## Local development

```bash
npm install
npx netlify dev
```

This runs the static site and the Netlify Functions together at `http://localhost:8888`. Copy `.env.example` to `.env` and fill in your Supabase/admin credentials first.

## Usage

### Running the Survey

1. **Direct link** - Share the survey URL with respondents
2. **WhatsApp** - Click "Share via WhatsApp" button on survey or admin dashboard
3. **Bulk sending** - Use the WhatsApp admin tools to generate a shareable link

The survey takes approximately 5 minutes to complete and works on mobile, tablet, and desktop.

### WhatsApp Distribution

**For Respondents:**
- Click "Share via WhatsApp" on survey intro or after completing
- Opens WhatsApp with a pre-populated message and link
- Sender's contact info is preserved (it's their own WhatsApp)

**For Admin:**
1. Navigate to dashboard with `?admin=true`
2. Scroll to "WhatsApp Distribution" section
3. Copy the survey share link or generate a WhatsApp-ready link
4. Customize the message template with `{LINK}` placeholder
5. Use the generated link to share on WhatsApp, messaging apps, or email

**Response Tracking:**
- Every response includes a `utm_source` tag (`whatsapp` vs `organic`, also supports `email`/`direct`)
- Dashboard shows a breakdown by source
- Export CSV includes source data

### Accessing the Dashboard

1. Navigate to the site with `?admin=true` in the URL
2. Enter your admin password
3. View analytics, charts, and opportunities
4. Manage WhatsApp distribution
5. Export responses to CSV

## Features Explained

### Survey Questions

**Part 1: Business Context**
- Industry and company size
- Role in the business
- Time-consuming tasks
- Manual work areas
- Missed or delayed tasks
- Hours lost per week

**Part 2: Solutions & Willingness**
- Ideal additional role
- Areas needing specialist support
- Current systems
- Business visibility score
- Daily Brief concept value
- Desired outcomes
- Comfort with automation
- Willingness to pay
- Definition of value
- Biggest business frustration

**Optional: Contact Details**
- Name, email, company
- Permission for follow-up interview

### Dashboard Analytics

- **Total Responses** - Count of completed surveys
- **Respondent Distribution** - By company size, industry
- **Manual Work Areas** - Top areas of wasted time
- **Hours Lost** - Distribution of time lost per week
- **Desired Support** - Most requested expertise areas
- **Systems Used** - Current tech stack adoption
- **Desired Outcomes** - Features/capabilities wanted most
- **AI Action Comfort** - Automation comfort levels
- **Willingness to Pay** - Revenue potential signal

### Opportunities Ranking

Automatically ranks the top 10 business problems to solve, based on a composite score of:
- Frequency (how often an area is mentioned across manual work areas, desired specialist support, and desired outcomes)
- Time impact (average hours lost per week among respondents who mentioned it)
- Willingness to pay signals (average willingness-to-pay among respondents who mentioned it)

## Project Structure

```
sme-business-survey/
├── public/
│   ├── index.html          # Survey + admin views (each question in a .question block)
│   ├── styles.css          # All styling, theming via CSS variables
│   ├── main.js              # Bootstraps survey or admin view based on ?admin=true
│   ├── survey.js            # Multi-step survey logic, validation, submission
│   └── admin.js              # Dashboard: analytics, charts, opportunities, CSV export, WhatsApp tools
├── netlify/functions/
│   ├── submit-response.js   # POST - sanitizes + inserts a response into Supabase
│   ├── admin-login.js       # POST - validates the admin password
│   └── get-responses.js     # GET  - password-protected, returns all responses (service role key)
├── supabase/
│   └── schema.sql            # Table definition + RLS policy
├── netlify.toml
├── package.json
└── .env.example
```

## Security

- Dashboard requires an admin password (stored in Netlify environment, compared with a timing-safe check)
- The Supabase `anon` key can only INSERT (enforced by RLS policy), never read
- Admin reads use the Supabase `service_role` key, kept server-side inside the Netlify function only - never sent to the browser
- No authentication library needed for simplicity

## WhatsApp Hybrid Approach

This survey uses a **hybrid WhatsApp distribution strategy**:

- Survey is optimized for web (best UX for forms with multiple question types)
- WhatsApp is used as a **distribution channel** (native share buttons, pre-populated messages)
- No per-message costs (links only, no chatbot API charges)
- Higher completion rates (web form UX > chat bot UX)
- Responses tracked by source (`utm_source` = whatsapp vs organic)

### Why Hybrid Over Native Chatbot?

| Aspect | Web Form | WhatsApp Bot |
|--------|----------|--------------|
| User experience | Excellent | Good (slower, typing required) |
| Cost per response | $0 | $0.005-0.10 (message costs) |
| Completion rate | 60-80% | 30-40% (people drop off) |
| Validation | Built-in (scales, checkboxes) | Manual (messy text parsing) |
| Data quality | High | Lower (typos, misunderstandings) |
| Mobile UX | Optimized | Basic |

**Result:** Using WhatsApp to share the web link gives you the best of both worlds: WhatsApp's distribution power + web form's superior UX, with zero message costs.

## Customization

### Change Admin Password

Update the `ADMIN_PASSWORD` environment variable in Netlify.

### Modify Questions

Edit the questions in `public/index.html`. Each question is in a `<div class="question" data-question="N">` block. Update the matching field name in `public/survey.js` (`collectFormData`) and in `netlify/functions/submit-response.js` (the `TEXT_FIELDS` / `ARRAY_FIELDS` / `SCORE_FIELDS` lists) if you add or rename a field, and add the matching column to `supabase/schema.sql`.

### Customize Styling

Edit `public/styles.css` to match your brand. Key variables:

```css
:root {
  --primary-color: #000;     /* Main color */
  --text-dark: #1a1a1a;      /* Text color */
  --bg-light: #f9f9f9;       /* Background */
}
```

### Add More Questions

1. Add a new `.question` block in `public/index.html` and bump `TOTAL_QUESTIONS` in `public/survey.js`
2. Add the field name to the appropriate list in `collectFormData()` (`public/survey.js`)
3. Add the field to `TEXT_FIELDS` / `ARRAY_FIELDS` / `SCORE_FIELDS` in `netlify/functions/submit-response.js`
4. Add the matching column to `supabase/schema.sql` and your live Supabase table

## Troubleshooting

### Survey submissions failing
- Check Netlify function logs: Site settings > Functions
- Verify Supabase credentials in environment variables
- Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Confirm the RLS insert policy from `supabase/schema.sql` was applied

### Dashboard not loading
- Verify the admin password is correct
- Check browser console for errors
- Ensure the Supabase database table exists
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (reads will fail without it, since RLS blocks anon reads)
- Check Netlify function logs for API errors

### Missing data in responses
- Verify all form field names match the serverless function's field lists
- Check that the Supabase table has all columns
- Review the browser console for JavaScript errors

## Deployment Checklist

- [ ] Supabase project created and `supabase/schema.sql` run
- [ ] GitHub repository created and code pushed
- [ ] Netlify site created and connected to GitHub
- [ ] Environment variables set (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`)
- [ ] Site redeployed after setting environment variables
- [ ] Test survey submission
- [ ] Test admin dashboard login
- [ ] Verify data appears in Supabase

## Support

For issues:
1. Check Netlify function logs
2. Check browser console (F12)
3. Check Supabase for data integrity
4. Review this README's troubleshooting section

## License

MIT

## Next Steps

After collecting responses:
1. Export data to CSV for analysis
2. Identify top 5-10 problems from the opportunities list
3. Validate findings with follow-up interviews
4. Prioritize solution development based on willingness to pay
5. Build an MVP for the highest-scoring opportunity
