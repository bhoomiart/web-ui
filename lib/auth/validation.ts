/**
 * lib/auth/validation.ts
 *
 * Input checks and message wording for the customer auth forms.
 * Pure functions, safe on client and server. Supabase enforces the real rules;
 * these give the shopper a clear message before a round trip.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): string | null {
  const email = normalizeEmail(value);
  if (!email) return 'Enter your email address.';
  if (email.length > 254 || !EMAIL.test(email)) return 'Enter a valid email address.';
  return null;
}

/** At least 8 characters with a letter and a number. 72 is bcrypt's limit. */
export function validatePassword(value: string): string | null {
  if (value.length < 8) return 'Use at least 8 characters.';
  if (value.length > 72) return 'Use 72 characters or fewer.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value))
    return 'Include at least one letter and one number.';
  return null;
}

/**
 * Supabase issues codes of 6 to 10 digits depending on the project's
 * "Email OTP Length" setting. When NEXT_PUBLIC_AUTH_OTP_LENGTH is set the code
 * must match it exactly; otherwise any length from 6 to 10 is accepted.
 */
export const OTP_LENGTH: number | null = Number(process.env.NEXT_PUBLIC_AUTH_OTP_LENGTH) || null;

export function validateCode(value: string): string | null {
  const ok = OTP_LENGTH ? value.length === OTP_LENGTH : value.length >= 6 && value.length <= 10;
  return ok && /^\d+$/.test(value) ? null : 'Enter the code from your email.';
}

export function validateName(value: string): string | null {
  return value.trim().length > 80 ? 'Use 80 characters or fewer.' : null;
}

interface AuthErrorLike {
  code?: string;
  status?: number;
  name?: string;
  message?: string;
}

/**
 * Shopper-facing wording. Never says whether an email is registered:
 * wrong password and unknown email read the same.
 */
export function authErrorMessage(err: AuthErrorLike | null | undefined): string {
  if (!err) return 'Something went wrong. Please try again.';

  const code = err.code ?? '';
  const msg = (err.message ?? '').toLowerCase();

  // The server answered with an error (for example the mail provider refused to send).
  // The auth library reports these as "retryable fetch errors" too, so check this first.
  if ((err.status ?? 0) >= 500 || code === 'unexpected_failure') {
    return "We're having trouble on our side right now, so the email may not have been sent. Please try again in a few minutes, or sign in with your password instead.";
  }

  // No answer at all: offline, DNS, timeout.
  if (
    err.name === 'AuthRetryableFetchError' ||
    msg.includes('failed to fetch') ||
    msg.includes('network')
  ) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  if (
    err.status === 429 ||
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    code === 'over_sms_send_rate_limit'
  ) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  // Supabase uses one code for both a wrong code and an expired one.
  if (code === 'otp_expired' || code === 'otp_disabled' || msg.includes('token has expired')) {
    return 'That code is incorrect or has expired. Check it, or send a new code.';
  }
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (code === 'weak_password') {
    return 'Choose a stronger password: at least 8 characters with letters and numbers.';
  }
  if (code === 'same_password') return 'Your new password must be different from the old one.';
  if (code === 'user_already_exists' || code === 'email_exists') {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (code === 'email_address_invalid') return 'Enter a valid email address.';
  if (code === 'signup_disabled') return 'Sign-ups are currently disabled. Please contact us.';
  if (code === 'session_not_found' || code === 'refresh_token_not_found') {
    return 'Your session has ended. Please sign in again.';
  }
  return 'Something went wrong. Please try again.';
}
