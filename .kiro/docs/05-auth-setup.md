# Customer Auth — Supabase Setup (A10-T5)

> The sign-in modal works with 6-digit codes typed into the page. Supabase only
> puts a code in the email if the **email template contains `{{ .Token }}`**.
> The default templates contain a link instead, so **do steps 1 to 3 before
> testing or launching**. Nothing in this file can be done from code.

Open: Supabase Dashboard → your project → **Authentication**.

---

## 1. Email templates (required)

**Copy from these files** (HTML and subject line are in each file's first comment):
`supabase/templates/magic-link.html`, `supabase/templates/confirmation.html`, `supabase/templates/recovery.html`.
Paste the HTML below the comment into the matching template and set the subject.

Authentication → **Emails** (or "Email Templates") → edit these three. Each one
must show `{{ .Token }}`. Paste the HTML below; adjust the wording if you like.

| Template           | Used when                                                   | Subject suggestion                    |
| ------------------ | ----------------------------------------------------------- | ------------------------------------- |
| **Magic Link**     | An existing customer asks for an email code                 | `Your Bhoomi Art sign-in code`        |
| **Confirm signup** | A new customer asks for a code, or signs up with a password | `Confirm your Bhoomi Art account`     |
| **Reset Password** | "Forgot password"                                           | `Your Bhoomi Art password reset code` |

Template body (same for all three, change the first sentence):

```html
<div style="font-family:Lato,Arial,sans-serif;background:#faf7f0;padding:32px 16px;">
  <div
    style="max-width:440px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #efe4d4;"
  >
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#3a1f12;margin:0 0 8px;">
      Bhoomi Art
    </h1>
    <p style="color:#5b4636;font-size:15px;margin:0 0 20px;">Use this code to finish signing in:</p>
    <p style="font-size:34px;letter-spacing:10px;font-weight:700;color:#b65e3c;margin:0 0 20px;">
      {{ .Token }}
    </p>
    <p style="color:#8a7565;font-size:13px;margin:0;">
      The code works for a short time and only once. If you didn't ask for it, you can ignore this
      email.
    </p>
  </div>
</div>
```

Sentence per template:

- Magic Link: "Use this code to sign in:"
- Confirm signup: "Use this code to confirm your email address:"
- Reset Password: "Use this code to reset your password:"

---

## 2. Custom SMTP (required before launch)

Supabase's built-in mailer is for testing only. It sends very few emails per
hour and, on new projects, only to your own team members' addresses, so real
customers would not receive codes.

Authentication → **Emails → SMTP Settings** → enable custom SMTP.

Free options that work: **Resend** (3,000 emails/month free) or **Brevo**
(300/day free). Both give you host, port, username and password. You also need
to verify your sending domain (add the DNS records they show). Use a sender such
as `no-reply@your-domain`.

After enabling, raise the email rate limit: Authentication → **Rate Limits**.

---

**Resend test sender limit (hit on Nov 27).** While the sender is `onboarding@resend.dev`, Resend only delivers to the email your Resend account was created with. Any other recipient is refused (`550 You can only send testing emails to your own email address`), Supabase returns HTTP 500 `unexpected_failure`, and the sign-in modal says "We're having trouble on our side...". To send to real customers and to the staff account: Resend → Domains → add your domain (a subdomain such as `mail.your-domain` is best), add the DNS records Resend shows, wait for "Verified", then in Supabase → SMTP Settings set the sender to an address on that domain (for example `no-reply@mail.your-domain`).

## 3. Other settings

Authentication → **Sign In / Providers → Email**:

- **Enable Email provider**: on
- **Confirm email**: **on** (customers must confirm before ordering; decision 5)
- **Secure password change**: on (optional)

Authentication → **Sign In / Providers → Email → OTP**:

- **Email OTP Expiration**: `600` seconds (10 minutes). The modal tells the
  shopper a code "may have expired" after 10 minutes.
- **Email OTP Length**: 6

Authentication → **Attack Protection** (or "Password Security"):

- **Leaked password protection**: on (checks new passwords against known breaches; may need the Pro plan)
- **Minimum password length**: 8

Authentication → **URL Configuration**:

- **Site URL**: your production URL (and `http://localhost:3000` for development)

---

## 4. How the flows map to Supabase

| Shopper action                       | Supabase call                                                                    | Template used                                   |
| ------------------------------------ | -------------------------------------------------------------------------------- | ----------------------------------------------- |
| Sign in or create with an email code | `signInWithOtp({ email, shouldCreateUser: true })`                               | Magic Link, or Confirm signup for a new address |
| Enter the code                       | `verifyOtp({ email, token, type: 'email' })`                                     |                                                 |
| Create account with a password       | `signUp({ email, password })`                                                    | Confirm signup                                  |
| Confirm that address                 | `verifyOtp({ email, token, type: 'signup' })`                                    |                                                 |
| Sign in with a password              | `signInWithPassword`                                                             |                                                 |
| Forgot password                      | `resetPasswordForEmail(email)`                                                   | Reset Password                                  |
| Enter the reset code                 | `verifyOtp({ email, token, type: 'recovery' })`, then `updateUser({ password })` |                                                 |

Mobile / WhatsApp OTP is deferred (see 04-cart-auth-flow-plan.md, decision 2).

## 5. Checklist

- [ ] Three email templates show `{{ .Token }}`
- [ ] Custom SMTP configured and a test email received at a non-team address
- [ ] Confirm email: on
- [ ] OTP expiry 600 s
- [ ] Leaked password protection: on
- [ ] Site URL set
