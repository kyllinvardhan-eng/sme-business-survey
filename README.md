# Business Survey

A clean, professional survey platform to understand operational challenges facing your business or company. Built entirely on Netlify — static frontend, serverless functions, and Netlify Forms as the data store.

## Features

- **5-minute survey** - 18 carefully crafted questions covering operations, systems, pain points, and willingness to pay
- **Responsive design** - Works on desktop, tablet, and mobile
- **WhatsApp distribution** - Native WhatsApp share buttons + admin tools for bulk sending
- **Response tracking** - See which responses came from WhatsApp vs organic
- **Admin dashboard** - Analytics, charts, opportunity ranking, and WhatsApp management
- **Data export** - Export all responses to CSV
- **Simple architecture** - Static frontend + Netlify Forms (storage) + serverless functions (admin reads)

## Setup

### Prerequisites

1. Netlify account (free)
2. GitHub account (for version control)

### Step 1: Deploy to Netlify

1. Push this code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign up
3. Click "Add new site" > "Import an existing project"
4. Connect your GitHub account and select the repository
5. Click "Deploy site"

Netlify automatically detects the `<form name="survey" data-netlify="true">` in `public/index.html` at build time and creates a "survey" form under Site settings > Forms, ready to receive submissions - no database to provision.

### Step 2: Configure Environment Variables

The public survey page needs no environment variables - form submissions are handled natively by Netlify. The **admin dashboard**, however, reads submissions through the Netlify API (since the anonymous public can't query them from the browser), so it needs credentials:

1. In Netlify, go to Site settings > Build & deploy > Environment
2. Add these variables:
   - `ADMIN_PASSWORD` - A strong password for dashboard access (choose this yourself)
   - `NETLIFY_SITE_ID` - Your site's ID (Site settings > General > Site details > Site ID)
   - `NETLIFY_ACCESS_TOKEN` - A Netlify Personal Access Token (User settings > Applications > New access token)

   Note: a Netlify Personal Access Token grants access to your whole Netlify account, not just this site (Netlify doesn't offer site-scoped tokens). Consider creating a dedicated token just for this function so you can revoke it independently of any token you use elsewhere, and rotate it if it's ever shared or logged.

3. Redeploy the site to apply the environment variables

### Step 3: Access Your Survey

- **Public survey**: `https://your-netlify-domain.com/`
- **Admin dashboard**: `https://your-netlify-domain.com/?admin=true`

Then login with the admin password you set.

## Local development

```bash
npx netlify dev
```

This runs the static site and the Netlify Functions together at `http://localhost:8888`. Copy `.env.example` to `.env` and fill in your admin credentials first. Note: Netlify Forms submissions only work on a deployed site (or via `netlify dev` once linked to a real site) - Netlify's form-processing bot doesn't run on a bare local server.

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
- Every response includes a `utm_source` tag (`whatsapp` vs `organic`, also supports `email`/`direct`), captured via a hidden form field set from the `?utm_source=` URL parameter
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
│   ├── index.html          # Survey + admin views. The survey form is a native
│   │                        # Netlify Form (data-netlify="true"), each question
│   │                        # in its own .question block
│   ├── styles.css          # All styling, theming via CSS variables
│   ├── main.js              # Bootstraps survey or admin view based on ?admin=true
│   ├── survey.js            # Multi-step wizard logic, AJAX submit to Netlify Forms
│   └── admin.js              # Dashboard: analytics, charts, opportunities, CSV export, WhatsApp tools
├── netlify/functions/
│   ├── admin-login.js       # POST - validates the admin password
│   └── get-responses.js     # GET  - password-protected, pulls all "survey" form
│                              # submissions from the Netlify API
├── netlify.toml
├── package.json
└── .env.example
```

## Security

- Dashboard requires an admin password (stored in Netlify environment, compared with a timing-safe check)
- Survey submissions go straight to Netlify's own form storage - nothing for the browser to write to directly
- Admin reads use a Netlify Personal Access Token, kept server-side inside the Netlify function only - never sent to the browser
- A honeypot field (`bot-field`) filters out simple bots; Netlify also offers built-in spam filtering per form in the dashboard
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

Edit the questions in `public/index.html`. Each question is in a `<div class="question" data-question="N">` block, inside the `<form name="survey" data-netlify="true">`. Because Netlify statically parses this HTML at build time to register form fields, any field you add just needs a `name` attribute (checkboxes in a group all share the same `name`) - no other wiring is required for submissions to be captured. Update `public/admin.js` if you want the new field to show up as a chart or column in the dashboard.

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

1. Add a new `.question` block in `public/index.html` inside the `survey` form, with a `name` attribute on its input(s), and bump `TOTAL_QUESTIONS` in `public/survey.js`
2. Redeploy - Netlify will pick up the new field automatically on the next build
3. Optionally add it to `CHECKBOX_FIELDS` / `SCORE_FIELDS` in `netlify/functions/get-responses.js` if it's a checkbox group or a numeric scale, and add a chart/column for it in `public/admin.js`

## Troubleshooting

### Survey submissions failing
- Check Netlify function logs and the deploy log: Site settings > Functions / Deploys
- Confirm Site settings > Forms shows a "survey" form - if it's missing, the `data-netlify="true"` form wasn't detected in the latest deploy (redeploy after any change)
- Netlify Forms only works on a real deploy - it won't detect submissions on a plain local dev server without `netlify dev` linked to a site

### Dashboard not loading
- Verify the admin password is correct
- Check browser console for errors
- Verify `NETLIFY_SITE_ID` and `NETLIFY_ACCESS_TOKEN` are set correctly in the site's environment variables
- Check Netlify function logs for API errors (e.g. an expired or revoked access token)

### Missing data in responses
- Verify new form fields have a `name` attribute and the site was redeployed after adding them
- Review the browser console for JavaScript errors during submission

## Deployment Checklist

- [ ] GitHub repository created and code pushed
- [ ] Netlify site created and connected to GitHub
- [ ] Confirmed Site settings > Forms shows the "survey" form after the first deploy
- [ ] Environment variables set (`ADMIN_PASSWORD`, `NETLIFY_SITE_ID`, `NETLIFY_ACCESS_TOKEN`)
- [ ] Site redeployed after setting environment variables
- [ ] Test survey submission
- [ ] Test admin dashboard login
- [ ] Verify the response appears in the dashboard and in Site settings > Forms

## Support

For issues:
1. Check Netlify function logs
2. Check browser console (F12)
3. Check Site settings > Forms for submission data integrity
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
