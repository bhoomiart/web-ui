/**
 * BreadcrumbNav — generic, data-driven breadcrumb navigation.
 *
 * Server component — no interactivity needed.
 * Renders semantic <nav> + <ol> with Schema.org BreadcrumbList
 * JSON-LD injected via a sibling <script> tag.
 *
 * Usage:
 *   <BreadcrumbNav
 *     items={[
 *       { label: 'Home',       href: '/' },
 *       { label: 'Shop',       href: '/shop' },
 *       { label: 'Pots',       href: '/category/pots' },
 *       { label: 'Clay Pot',              }, // last item — no href
 *     ]}
 *   />
 */

export interface BreadcrumbItem {
  label: string
  /** Omit for the current/last page */
  href?: string
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
  /** Additional class names on the <nav> wrapper */
  className?: string
}

export function BreadcrumbNav({ items, className = '' }: BreadcrumbNavProps) {
  if (items.length < 2) return null

  // Schema.org JSON-LD for BreadcrumbList (A5 / A8 wires this fully)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted internal JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        aria-label="Breadcrumb"
        className={`${className}`}
      >
        <ol
          className={[
            'flex flex-wrap items-center gap-[var(--spacing-1)]',
            'list-none m-0 p-0',
            'text-[var(--font-size-sm)]',
          ].join(' ')}
          role="list"
        >
          {items.map((item, index) => {
            const isLast = index === items.length - 1

            return (
              <li
                key={`${item.href ?? item.label}-${index}`}
                className="flex items-center gap-[var(--spacing-1)]"
              >
                {/* Separator — hidden for first item */}
                {index > 0 && (
                  <svg
                    aria-hidden="true"
                    className="w-3.5 h-3.5 text-[var(--color-earth-300)] shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                )}

                {isLast || !item.href ? (
                  // Current page — not a link
                  <span
                    aria-current="page"
                    className="text-[var(--color-earth-700)] font-medium truncate max-w-[200px]"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                ) : (
                  // Ancestor — link
                  <a
                    href={item.href}
                    className={[
                      'text-[var(--color-earth-500)]',
                      'hover:text-[var(--color-brand-primary)]',
                      'transition-colors duration-[var(--duration-fast)]',
                      'focus-visible:outline-none focus-visible:underline',
                      'whitespace-nowrap',
                    ].join(' ')}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
