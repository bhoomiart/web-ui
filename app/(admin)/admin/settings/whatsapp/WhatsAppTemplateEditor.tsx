'use client';

/**
 * WhatsAppTemplateEditor
 *
 * Client component that lets admins edit WhatsApp message templates
 * stored in site_settings. Calls PATCH /api/admin/settings.
 */

import React from 'react';

interface TemplateDef {
  key: string;
  label: string;
  description: string;
  variables: string[];
  defaultValue: string;
}

interface WhatsAppTemplateEditorProps {
  templates: TemplateDef[];
  savedValues: Record<string, string>;
}

export function WhatsAppTemplateEditor({ templates, savedValues }: WhatsAppTemplateEditorProps) {
  const [values, setValues] = React.useState<Record<string, string>>(
    Object.fromEntries(templates.map((t) => [t.key, savedValues[t.key] ?? '']))
  );
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSaveAll() {
    setSaving(true);
    setError(null);
    setSaved(false);

    // Only send keys that have a value (empty = use default)
    const payload = Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim() !== ''));

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to save.');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-[var(--spacing-6)]">
      {templates.map((template) => {
        const currentValue = values[template.key] ?? '';
        const isCustomised = currentValue.trim() !== '';

        return (
          <div
            key={template.key}
            className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-5)]"
          >
            <div className="flex items-start justify-between gap-[var(--spacing-4)] mb-[var(--spacing-3)]">
              <div>
                <h3 className="heading-5">{template.label}</h3>
                <p className="body-small">{template.description}</p>
              </div>
              {isCustomised ? (
                <span
                  className="shrink-0 inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold"
                  style={{ color: 'var(--color-info)', background: 'var(--color-info-light)' }}
                >
                  Custom
                </span>
              ) : (
                <span
                  className="shrink-0 inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold"
                  style={{ color: 'var(--color-earth-400)', background: 'var(--color-earth-100)' }}
                >
                  Default
                </span>
              )}
            </div>

            {/* Variables reference */}
            <div className="flex flex-wrap gap-[var(--spacing-1)] mb-[var(--spacing-3)]">
              <span className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
                Variables:
              </span>
              {template.variables.map((v) => (
                <code
                  key={v}
                  className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-sm)] text-[var(--font-size-xs)] font-mono"
                  style={{
                    background: 'var(--color-earth-100)',
                    color: 'var(--color-brand-primary)',
                  }}
                >
                  {v}
                </code>
              ))}
            </div>

            {/* Default preview (shown when no custom value) */}
            {!isCustomised && (
              <div
                className="mb-[var(--spacing-3)] px-[var(--spacing-3)] py-[var(--spacing-3)] rounded-[var(--radius-md)] text-[var(--font-size-xs)] whitespace-pre-wrap leading-relaxed"
                style={{ background: 'var(--color-earth-50)', color: 'var(--color-earth-500)' }}
              >
                <p className="font-semibold mb-1 text-[var(--color-earth-400)]">Default message:</p>
                {template.defaultValue}
              </div>
            )}

            {/* Editor */}
            <textarea
              value={currentValue}
              onChange={(e) => setValues((v) => ({ ...v, [template.key]: e.target.value }))}
              rows={5}
              placeholder={`Leave blank to use default. Use ${template.variables.join(', ')} as placeholders.`}
              className="w-full px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--radius-md)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-sm)] text-[var(--color-earth-800)] placeholder:text-[var(--color-earth-300)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)]/20 font-mono resize-y"
            />

            {isCustomised && (
              <button
                type="button"
                onClick={() => setValues((v) => ({ ...v, [template.key]: '' }))}
                className="mt-[var(--spacing-2)] text-[var(--font-size-xs)] text-[var(--color-earth-400)] hover:text-[var(--color-error)] transition-colors"
              >
                Reset to default
              </button>
            )}
          </div>
        );
      })}

      {/* Save all */}
      <div className="sticky bottom-[var(--spacing-6)] flex items-center justify-end gap-[var(--spacing-4)]">
        {error && (
          <p role="alert" className="text-[var(--font-size-sm)] text-[var(--color-error)]">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="text-[var(--font-size-sm)] text-[var(--color-success)]">
            ✓ Templates saved
          </p>
        )}
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold text-[var(--font-size-sm)] hover:bg-[var(--color-earth-700)] transition-colors shadow-[var(--shadow-button)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
        >
          {saving ? (
            <span
              className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"
              aria-hidden="true"
            />
          ) : null}
          Save All Templates
        </button>
      </div>
    </div>
  );
}
