export const instant = false;
import { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';
/**
 * /admin/settings — Site settings page.
 * Loads all settings from site_settings table and groups them into sections.
 */

import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { createAdminClient } from '@/lib/supabase/admin';

type SettingRow = {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
};

type Section = {
  label: string;
  prefix: string[];
  keys: SettingRow[];
};

const SECTION_DEFS: { label: string; prefix: string[] }[] = [
  { label: 'Brand', prefix: ['brand_', 'site_name', 'site_description', 'logo', 'favicon'] },
  { label: 'Contact', prefix: ['contact_', 'email_', 'address_'] },
  { label: 'WhatsApp', prefix: ['whatsapp_'] },
  { label: 'Analytics', prefix: ['ga_', 'gtm_', 'fb_pixel', 'analytics_'] },
  { label: 'Policy', prefix: ['policy_', 'terms_', 'privacy_', 'return_'] },
];

function assignToSection(settings: SettingRow[]): Section[] {
  const matched = new Set<string>();
  const sections: Section[] = SECTION_DEFS.map((def) => ({ ...def, keys: [] }));
  const other: Section = { label: 'Other', prefix: [], keys: [] };

  for (const setting of settings) {
    let placed = false;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].prefix.some((p) => setting.key.startsWith(p) || setting.key === p)) {
        sections[i].keys.push(setting);
        matched.add(setting.key);
        placed = true;
        break;
      }
    }
    if (!placed) other.keys.push(setting);
  }

  const result = sections.filter((s) => s.keys.length > 0);
  if (other.keys.length > 0) result.push(other);
  return result;
}

export default async function SettingsPagePage() {
  await requireStaff();
  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Site-wide configuration."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Settings' }]}
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading..." />
          </div>
        }
      >
        <SettingsPageContent />
      </Suspense>
    </div>
  );
}

async function SettingsPageContent() {
  await requireStaff();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('site_settings')
    .select('key, value, description, updated_at')
    .order('key', { ascending: true });

  if (error) throw new Error(`SettingsPage: ${error.message}`);

  const settings = (data ?? []) as SettingRow[];
  const sections = assignToSection(settings);

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="View and manage site-wide configuration."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Settings' }]}
      />

      {settings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--color-earth-400)]">
          <svg
            className="w-10 h-10 mb-3 opacity-40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-[var(--font-size-sm)]">No settings found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[var(--spacing-8)]">
          {sections.map((section) => (
            <section key={section.label}>
              <h2 className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-500)] uppercase tracking-widest mb-[var(--spacing-3)] px-1">
                {section.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--spacing-3)]">
                {section.keys.map((setting) => (
                  <div
                    key={setting.key}
                    className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-4)]"
                  >
                    <p className="text-[var(--font-size-xs)] font-mono text-[var(--color-earth-400)] mb-1 truncate">
                      {setting.key}
                    </p>
                    <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)] break-words mb-1">
                      {setting.value || (
                        <span className="italic text-[var(--color-earth-300)]">empty</span>
                      )}
                    </p>
                    {setting.description && (
                      <p className="text-[var(--font-size-xs)] text-[var(--color-earth-400)] mt-1">
                        {setting.description}
                      </p>
                    )}
                    <p className="text-[var(--font-size-2xs)] text-[var(--color-earth-300)] mt-2">
                      Updated{' '}
                      {new Date(setting.updated_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
