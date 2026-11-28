'use client';

/**
 * AuthModal
 *
 * One modal for sign in and create account, opened from anywhere through
 * useAuthModalStore. The page behind it, and the cart, are never touched.
 *
 * Ways in (all handled by Supabase Auth, which owns the security):
 *   Email code   one-time code by email. Signs in, or creates the account.
 *   Password     email + password. Creating an account confirms the email with a code.
 *   Reset        "Forgot password" sends a code, then sets a new password.
 *
 * Every step that sends a code has a 60 second resend countdown and a clear
 * message when the code is wrong or expired. Error wording never reveals
 * whether an email is registered.
 *
 * After success the modal closes and, if the opener asked for it, the shopper
 * is sent on (for example to /checkout). <CartSync> merges the guest cart
 * into the account on the SIGNED_IN event.
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { useAuthModalStore } from '@/lib/store/authModalStore';
import {
  authErrorMessage,
  normalizeEmail,
  OTP_LENGTH,
  validateCode,
  validateEmail,
  validateName,
  validatePassword,
} from '@/lib/auth/validation';

type Tab = 'signin' | 'signup';
type Method = 'code' | 'password';
type Step = 'form' | 'code' | 'forgot' | 'new-password';
/** What the one-time code is for */
type Purpose = 'email' | 'signup' | 'recovery';

const RESEND_SECONDS = 60;
/** After this long we suggest asking for a new code. Supabase's own limit is configurable. */
const CODE_STALE_MS = 10 * 60 * 1000;

export function AuthModal() {
  const router = useRouter();
  const toast = useToast();
  const { isOpen, reason, redirectTo, tab: requestedTab, close } = useAuthModalStore();

  const [tab, setTab] = React.useState<Tab>('signin');
  const [method, setMethod] = React.useState<Method>('code');
  const [step, setStep] = React.useState<Step>('form');
  const [purpose, setPurpose] = React.useState<Purpose>('email');

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [code, setCode] = React.useState('');

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [info, setInfo] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);
  const [codeStale, setCodeStale] = React.useState(false);
  /** When the current code was sent. Restarts the "may have expired" timer. */
  const [sentAt, setSentAt] = React.useState(0);

  // Give focus back to the button that opened the modal, so a keyboard user keeps their place.
  // Skipped when that element is gone (for example the Sign in button became the account menu).
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (isOpen) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const opener = useAuthModalStore.getState().opener;
    if (opener?.isConnected) opener.focus();
  }, [isOpen]);

  // Fresh start every time the modal opens.
  React.useEffect(() => {
    if (!isOpen) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setTab(requestedTab);
    setMethod('code');
    setStep('form');
    setPurpose('email');
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setCode('');
    setBusy(false);
    setError(null);
    setFieldErrors({});
    setInfo(null);
    setCooldown(0);
    setCodeStale(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen, requestedTab]);

  // Put the cursor in the first field. The Modal's focus trap focuses its close
  // button on open, so wait a beat and move focus to the form.
  React.useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => {
      document.querySelector<HTMLElement>('#auth-panel input:not([disabled])')?.focus();
    }, 60);
    return () => clearTimeout(id);
  }, [isOpen, step, tab, method]);

  // Resend countdown
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // "This code may have expired" hint
  React.useEffect(() => {
    if (step !== 'code') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCodeStale(false);
    const id = setTimeout(() => setCodeStale(true), CODE_STALE_MS);
    return () => clearTimeout(id);
  }, [step, sentAt]);

  // ── helpers ────────────────────────────────────────────────────────────────

  const supabase = React.useMemo(() => createClient(), []);

  function clearMessages() {
    setError(null);
    setFieldErrors({});
    setInfo(null);
  }

  function goToCodeStep(forPurpose: Purpose, message: string) {
    setPurpose(forPurpose);
    setCode('');
    clearMessages();
    setInfo(message);
    setCooldown(RESEND_SECONDS);
    setSentAt(Date.now());
    setStep('code');
  }

  /** The signed-in user's role, or null if it cannot be read (never blocks sign-in). */
  async function readRole(): Promise<string | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      return data?.role ?? null;
    } catch {
      return null;
    }
  }

  /**
   * After a successful sign-in: staff and admins go to the admin area, everyone
   * else goes where the opener asked (for example /checkout) or stays put.
   */
  async function finish(title: string) {
    setBusy(true); // keeps the form locked while the role is read
    const role = await readRole();
    const isStaff = role === 'admin' || role === 'staff';
    toast.add({
      variant: 'success',
      title,
      message: isStaff ? 'Taking you to the admin area.' : undefined,
      duration: 3000,
    });
    close();
    const target = isStaff ? '/admin/dashboard' : redirectTo;
    if (target) router.push(target);
    // Server-rendered parts of the current page (for example the checkout form's
    // saved details) were rendered for a signed-out visitor. Fetch them again.
    router.refresh();
  }

  function switchTab(next: Tab) {
    if (next === tab) return;
    setTab(next);
    setStep('form');
    clearMessages();
  }

  function switchMethod(next: Method) {
    if (next === method) return;
    setMethod(next);
    setStep('form');
    clearMessages();
  }

  // ── actions ────────────────────────────────────────────────────────────────

  async function sendEmailCode(e?: React.FormEvent) {
    e?.preventDefault();
    clearMessages();
    const errs: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    const nameErr = tab === 'signup' ? validateName(name) : null;
    if (nameErr) errs.name = nameErr;
    if (Object.keys(errs).length) return setFieldErrors(errs);

    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: normalizeEmail(email),
      options: {
        shouldCreateUser: true,
        data: tab === 'signup' && name.trim() ? { full_name: name.trim() } : undefined,
      },
    });
    setBusy(false);

    if (err) return setError(authErrorMessage(err));
    goToCodeStep('email', `We sent a code to ${normalizeEmail(email)}.`);
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    const errs: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    if (!password) errs.password = 'Enter your password.';
    if (Object.keys(errs).length) return setFieldErrors(errs);

    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (err) {
      // Registered but never confirmed: send a fresh code and let them finish.
      if (err.code === 'email_not_confirmed') {
        const { error: resendErr } = await supabase.auth.resend({
          type: 'signup',
          email: normalizeEmail(email),
        });
        setBusy(false);
        if (resendErr) return setError(authErrorMessage(resendErr));
        return goToCodeStep(
          'signup',
          'Please confirm your email first. We sent a code to ' + normalizeEmail(email) + '.'
        );
      }
      setBusy(false);
      return setError(authErrorMessage(err));
    }

    setBusy(false);
    await finish('Signed in');
  }

  async function signUpWithPassword(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    const errs: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    const pwErr = validatePassword(password);
    if (pwErr) errs.password = pwErr;
    const nameErr = validateName(name);
    if (nameErr) errs.name = nameErr;
    if (Object.keys(errs).length) return setFieldErrors(errs);

    setBusy(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: { data: name.trim() ? { full_name: name.trim() } : undefined },
    });
    setBusy(false);

    if (err) return setError(authErrorMessage(err));
    // Email confirmation is switched off: signed in straight away.
    if (data.session) return await finish('Account created');
    goToCodeStep('signup', `We sent a code to ${normalizeEmail(email)} to confirm your email.`);
  }

  /** @param token the code to check. Passed in when auto-submitting on the sixth digit. */
  async function verifyCode(e?: React.FormEvent, token: string = code) {
    e?.preventDefault();
    if (busy) return;
    clearMessages();
    const codeErr = validateCode(token);
    if (codeErr) return setFieldErrors({ code: codeErr });

    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email: normalizeEmail(email),
      token,
      type: purpose === 'email' ? 'email' : purpose === 'signup' ? 'signup' : 'recovery',
    });
    setBusy(false);

    if (err) {
      setCode('');
      return setError(authErrorMessage(err));
    }

    if (purpose === 'recovery') {
      clearMessages();
      setPassword('');
      return setStep('new-password');
    }
    await finish(purpose === 'signup' ? 'Account created' : 'Signed in');
  }

  async function resendCode() {
    if (cooldown > 0 || busy) return;
    clearMessages();
    setBusy(true);
    const addr = normalizeEmail(email);
    const { error: err } =
      purpose === 'signup'
        ? await supabase.auth.resend({ type: 'signup', email: addr })
        : purpose === 'recovery'
          ? await supabase.auth.resetPasswordForEmail(addr)
          : await supabase.auth.signInWithOtp({ email: addr, options: { shouldCreateUser: true } });
    setBusy(false);

    if (err) return setError(authErrorMessage(err));
    setCode('');
    setInfo(`A new code is on its way to ${addr}.`);
    setCooldown(RESEND_SECONDS);
    setSentAt(Date.now());
  }

  async function sendResetCode(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    const emailErr = validateEmail(email);
    if (emailErr) return setFieldErrors({ email: emailErr });

    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email));
    setBusy(false);

    if (err) return setError(authErrorMessage(err));
    // Same message whether or not the email is registered.
    goToCodeStep('recovery', `If ${normalizeEmail(email)} has an account, we sent a code to it.`);
  }

  async function saveNewPassword(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    const pwErr = validatePassword(password);
    if (pwErr) return setFieldErrors({ password: pwErr });

    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (err) return setError(authErrorMessage(err));
    await finish('Password updated');
  }

  // ── view ───────────────────────────────────────────────────────────────────

  const title =
    step === 'code'
      ? purpose === 'recovery'
        ? 'Reset your password'
        : 'Enter your code'
      : step === 'forgot'
        ? 'Reset your password'
        : step === 'new-password'
          ? 'Choose a new password'
          : tab === 'signin'
            ? 'Sign in'
            : 'Create your account';

  return (
    <Modal open={isOpen} onClose={close} title={title} size="md" persistent={busy}>
      <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto -mx-1 px-1">
        {/* Why we are asking */}
        {reason && step === 'form' && (
          <div className="mb-[var(--spacing-4)] flex items-start gap-[var(--spacing-3)] rounded-[var(--radius-md)] bg-[var(--color-earth-50)] border border-[var(--color-earth-100)] px-[var(--spacing-4)] py-[var(--spacing-3)]">
            <svg
              aria-hidden="true"
              className="w-5 h-5 mt-0.5 shrink-0 text-[var(--color-brand-primary)]"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <rect x="4" y="9" width="12" height="8" rx="2" />
              <path strokeLinecap="round" d="M7 9V6a3 3 0 016 0v3" />
            </svg>
            <div>
              <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)]">
                {reason}
              </p>
              <p className="text-[var(--font-size-xs)] text-[var(--color-earth-600)] mt-0.5">
                Your cart is saved and will be waiting for you.
              </p>
            </div>
          </div>
        )}

        {/* Tabs + method switch (only on the first screen) */}
        {step === 'form' && (
          <>
            <div
              role="tablist"
              aria-label="Sign in or create account"
              className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-[var(--color-earth-100)] p-1 mb-[var(--spacing-4)]"
            >
              {(
                [
                  ['signin', 'Sign in'],
                  ['signup', 'Create account'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`auth-tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls="auth-panel"
                  onClick={() => switchTab(id)}
                  className={`h-9 rounded-[var(--radius-sm)] text-[var(--font-size-sm)] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
                    tab === id
                      ? 'bg-white text-[var(--color-brand-primary)] shadow-[var(--shadow-sm)]'
                      : 'text-[var(--color-earth-600)] hover:text-[var(--color-earth-900)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              className="flex items-center gap-[var(--spacing-2)] mb-[var(--spacing-4)]"
              role="group"
              aria-label="How do you want to continue?"
            >
              {(
                [
                  ['code', 'Email code'],
                  ['password', 'Password'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={method === id}
                  onClick={() => switchMethod(id)}
                  className={`px-[var(--spacing-3)] py-1 rounded-[var(--radius-full)] border text-[var(--font-size-xs)] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
                    method === id
                      ? 'border-[var(--color-earth-600)] bg-[var(--color-earth-600)] text-white'
                      : 'border-[var(--color-earth-200)] text-[var(--color-earth-600)] hover:border-[var(--color-brand-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        <div
          id="auth-panel"
          role={step === 'form' ? 'tabpanel' : undefined}
          aria-labelledby={step === 'form' ? `auth-tab-${tab}` : undefined}
        >
          {/* Messages */}
          <div aria-live="polite">
            {info && !error && (
              <p className="mb-[var(--spacing-3)] text-[var(--font-size-sm)] text-[var(--color-earth-700)]">
                {info}
              </p>
            )}
          </div>
          {error && (
            <p
              role="alert"
              className="mb-[var(--spacing-3)] rounded-[var(--radius-md)] border border-[var(--color-error)] bg-[var(--color-error-light)] px-[var(--spacing-3)] py-[var(--spacing-2)] text-[var(--font-size-sm)] text-[var(--color-error-dark)]"
            >
              {error}
            </p>
          )}

          {/* ── Step: form ─────────────────────────────────────────────── */}
          {step === 'form' && method === 'code' && (
            <form
              onSubmit={sendEmailCode}
              noValidate
              className="flex flex-col gap-[var(--spacing-4)]"
            >
              <p className="text-[var(--font-size-sm)] text-[var(--color-earth-600)]">
                {tab === 'signin'
                  ? "We'll email you a sign-in code. No password needed."
                  : "New here? Enter your email and we'll create your account with a code."}
              </p>
              {tab === 'signup' && (
                <FormField label="Name (optional)" htmlFor="auth-name" error={fieldErrors.name}>
                  <Input
                    id="auth-name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={fieldErrors.name}
                    maxLength={80}
                  />
                </FormField>
              )}
              <FormField label="Email" htmlFor="auth-email" error={fieldErrors.email} required>
                <Input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldErrors.email}
                />
              </FormField>
              <Button type="submit" size="lg" loading={busy} className="w-full">
                {tab === 'signin' ? 'Email me a code' : 'Create account with a code'}
              </Button>
            </form>
          )}

          {step === 'form' && method === 'password' && tab === 'signin' && (
            <form
              onSubmit={signInWithPassword}
              noValidate
              className="flex flex-col gap-[var(--spacing-4)]"
            >
              <FormField label="Email" htmlFor="auth-email" error={fieldErrors.email} required>
                <Input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldErrors.email}
                />
              </FormField>
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="auth-password"
                    className="block text-[var(--font-size-sm)] font-medium text-[var(--color-earth-700)] mb-1.5"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setStep('forgot');
                    }}
                    className="text-[var(--font-size-xs)] font-semibold text-[var(--color-brand-primary)] hover:underline focus-visible:outline-none focus-visible:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <PasswordInput
                  id="auth-password"
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  autoComplete="current-password"
                  error={fieldErrors.password}
                />
              </div>
              <Button type="submit" size="lg" loading={busy} className="w-full">
                Sign in
              </Button>
            </form>
          )}

          {step === 'form' && method === 'password' && tab === 'signup' && (
            <form
              onSubmit={signUpWithPassword}
              noValidate
              className="flex flex-col gap-[var(--spacing-4)]"
            >
              <FormField label="Name (optional)" htmlFor="auth-name" error={fieldErrors.name}>
                <Input
                  id="auth-name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={fieldErrors.name}
                  maxLength={80}
                />
              </FormField>
              <FormField label="Email" htmlFor="auth-email" error={fieldErrors.email} required>
                <Input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldErrors.email}
                />
              </FormField>
              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-[var(--font-size-sm)] font-medium text-[var(--color-earth-700)] mb-1.5"
                >
                  Password
                  <span aria-hidden="true" className="ml-0.5 text-[var(--color-error)]">
                    *
                  </span>
                </label>
                <PasswordInput
                  id="auth-password"
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  autoComplete="new-password"
                  error={fieldErrors.password}
                  describedBy="auth-password-hint"
                />
                {!fieldErrors.password && (
                  <p
                    id="auth-password-hint"
                    className="mt-1.5 text-[var(--font-size-xs)] text-[var(--color-earth-600)]"
                  >
                    At least 8 characters, with letters and numbers. We&apos;ll email a code to
                    confirm your address.
                  </p>
                )}
              </div>
              <Button type="submit" size="lg" loading={busy} className="w-full">
                Create account
              </Button>
            </form>
          )}

          {/* ── Step: enter code ───────────────────────────────────────── */}
          {step === 'code' && (
            <form onSubmit={verifyCode} noValidate className="flex flex-col gap-[var(--spacing-4)]">
              <FormField label="Code from your email" htmlFor="auth-code" error={fieldErrors.code}>
                <Input
                  id="auth-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={OTP_LENGTH ?? 10}
                  autoFocus
                  value={code}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH ?? 10);
                    setCode(digits);
                    // Auto-submit once the full code is in (typing, paste or autofill). Only when the
                    // project's code length is configured; otherwise the Verify button is used.
                    if (OTP_LENGTH && digits.length === OTP_LENGTH)
                      void verifyCode(undefined, digits);
                  }}
                  error={fieldErrors.code}
                  disabled={busy}
                  placeholder="······"
                  className="text-center text-[var(--font-size-2xl)] tracking-[0.5em] font-semibold"
                />
              </FormField>

              {codeStale && (
                <p className="text-[var(--font-size-xs)] text-[var(--color-warning-dark)]">
                  This code may have expired. Send a new one if it doesn&apos;t work.
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                loading={busy}
                disabled={validateCode(code) !== null}
                className="w-full"
              >
                {purpose === 'recovery' ? 'Verify code' : 'Verify and continue'}
              </Button>

              <div className="flex items-center justify-between text-[var(--font-size-sm)]">
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={cooldown > 0 || busy}
                  className="font-semibold text-[var(--color-brand-primary)] hover:underline disabled:text-[var(--color-earth-400)] disabled:no-underline disabled:cursor-not-allowed focus-visible:outline-none focus-visible:underline"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setCode('');
                    setStep('form');
                  }}
                  className="text-[var(--color-earth-600)] hover:text-[var(--color-earth-900)] focus-visible:outline-none focus-visible:underline"
                >
                  Use a different email
                </button>
              </div>

              {purpose === 'signup' && (
                <p className="text-[var(--font-size-xs)] text-[var(--color-earth-600)]">
                  No code after a minute? You may already have an account.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setTab('signin');
                      setMethod('password');
                      setStep('form');
                      clearMessages();
                    }}
                    className="font-semibold text-[var(--color-brand-primary)] hover:underline"
                  >
                    Sign in instead
                  </button>
                </p>
              )}
            </form>
          )}

          {/* ── Step: forgot password ──────────────────────────────────── */}
          {step === 'forgot' && (
            <form
              onSubmit={sendResetCode}
              noValidate
              className="flex flex-col gap-[var(--spacing-4)]"
            >
              <p className="text-[var(--font-size-sm)] text-[var(--color-earth-600)]">
                Enter your email and we&apos;ll send a code so you can choose a new password.
              </p>
              <FormField label="Email" htmlFor="auth-email" error={fieldErrors.email} required>
                <Input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldErrors.email}
                />
              </FormField>
              <Button type="submit" size="lg" loading={busy} className="w-full">
                Send reset code
              </Button>
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setStep('form');
                }}
                className="text-center text-[var(--font-size-sm)] text-[var(--color-earth-600)] hover:text-[var(--color-earth-900)] focus-visible:outline-none focus-visible:underline"
              >
                Back to sign in
              </button>
            </form>
          )}

          {/* ── Step: new password ─────────────────────────────────────── */}
          {step === 'new-password' && (
            <form
              onSubmit={saveNewPassword}
              noValidate
              className="flex flex-col gap-[var(--spacing-4)]"
            >
              <p className="text-[var(--font-size-sm)] text-[var(--color-earth-600)]">
                Code accepted. Choose a new password for your account.
              </p>
              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-[var(--font-size-sm)] font-medium text-[var(--color-earth-700)] mb-1.5"
                >
                  New password
                </label>
                <PasswordInput
                  id="auth-password"
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  autoComplete="new-password"
                  error={fieldErrors.password}
                  autoFocus
                  describedBy="auth-password-hint"
                />
                {!fieldErrors.password && (
                  <p
                    id="auth-password-hint"
                    className="mt-1.5 text-[var(--font-size-xs)] text-[var(--color-earth-600)]"
                  >
                    At least 8 characters, with letters and numbers.
                  </p>
                )}
              </div>
              <Button type="submit" size="lg" loading={busy} className="w-full">
                Save password
              </Button>
            </form>
          )}
        </div>

        <p className="mt-[var(--spacing-5)] text-center text-[var(--font-size-xs)] text-[var(--color-earth-600)]">
          By continuing you agree to our{' '}
          <Link
            href="/policies/terms"
            onClick={close}
            className="underline hover:text-[var(--color-earth-800)]"
          >
            Terms
          </Link>{' '}
          and{' '}
          <Link
            href="/policies/privacy"
            onClick={close}
            className="underline hover:text-[var(--color-earth-800)]"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </Modal>
  );
}

// ─── Password field with show / hide ─────────────────────────────────────────

function PasswordInput({
  id,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  error,
  autoFocus,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  error?: string;
  autoFocus?: boolean;
  describedBy?: string;
}) {
  return (
    <>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          aria-describedby={describedBy}
          className="pr-16"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 px-[var(--spacing-3)] text-[var(--font-size-xs)] font-semibold text-[var(--color-earth-600)] hover:text-[var(--color-earth-900)] focus-visible:outline-none focus-visible:underline"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-[var(--font-size-xs)] text-[var(--color-error)]">
          {error}
        </p>
      )}
    </>
  );
}
