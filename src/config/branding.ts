/**
 * Identity, attribution, licensing and contact details for this edition, kept in one place so a
 * future publisher or repository owner changes them here only.
 */

export const APP_VERSION = __APP_VERSION__

/** True only in the GitHub Pages preview build, which shows a notice that it is a test version. */
export const IS_PREVIEW = import.meta.env.VITE_PREVIEW === 'true'

export const BRANDING = {
  title: 'AI Integration Review',
  publisher: 'A GenAI:N3 resource',
  /** The network's name. Always written in full, never shortened. */
  network: 'GenAI:N3',
  siteUrl: 'https://air.genain3.ie/',
  /** Approved wording. Do not paraphrase. */
  attribution:
    'Created by Dr Hazel Farrell in collaboration with Ken McCarthy, with support from ChatGPT and Claude Code.',
  repositoryUrl: 'https://github.com/kenmccarthy/genain3-air',
  /** The SETU edition this one was adapted from, and the commit it was adapted at. */
  source: {
    name: 'SETU AI Integration Review',
    repositoryUrl: 'https://github.com/kenmccarthy/setu-module-review',
    commit: '8acfcc8093e63834058c8d69366f8f23beefaff5',
  },
  feedback: {
    email: 'air@genain3.ie',
    /** `{version}` is replaced with the application version, e.g. "v1.0.0". */
    subject: 'AI Integration Review feedback — {version}',
  },
} as const

export const LICENCES = {
  code: {
    name: 'GNU General Public License v3.0 or later',
    spdx: 'GPL-3.0-or-later',
    url: 'https://www.gnu.org/licenses/gpl-3.0.html',
  },
  content: {
    name: 'Creative Commons Attribution–ShareAlike 4.0 International',
    spdx: 'CC-BY-SA-4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
} as const

/** e.g. "v1.0.0" */
export const versionLabel = (version = APP_VERSION) => `v${version}`

/**
 * The feedback link. Only the version goes in the subject: no review content, institution name,
 * browser details or other personal information is ever added.
 */
export function feedbackMailto(version = APP_VERSION): string {
  const subject = BRANDING.feedback.subject.replace('{version}', versionLabel(version))
  return `mailto:${BRANDING.feedback.email}?subject=${encodeURIComponent(subject)}`
}

/**
 * Prefix of every localStorage key this edition uses. It differs from the SETU edition's prefix,
 * so the two editions never read or write each other's data.
 */
export const STORAGE_PREFIX = 'genain3-air'

/**
 * Written into saved and exported files to record which application produced them. It is
 * informational only and is not proof of origin: files can be edited, and older files have none.
 */
export const GENERATOR = { app: STORAGE_PREFIX, version: APP_VERSION }
