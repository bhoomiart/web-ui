/**
 * Customer profile area: /account, /account/orders, /account/addresses, /account/payments.
 * The pages sign the customer in when needed (they read their own data through the API).
 */
import { AccountNav } from './AccountNav';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-brand py-[var(--spacing-12)]">
      <div className="grid md:grid-cols-[220px_1fr] gap-[var(--spacing-8)] max-w-5xl mx-auto">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
