import { Link } from 'react-router-dom'
import { PageTitle, Section } from '../components/fields'
import { APP_VERSION, BRANDING, LICENCES, feedbackMailto, versionLabel } from '../config/branding'
import { ABOUT } from '../content/about'

const link = 'font-medium text-brand-700 underline'

export function AboutPage() {
  return (
    <>
      <PageTitle part={BRANDING.publisher} title={ABOUT.title} />
      <Section title="Purpose">
        {ABOUT.purpose.map((p) => (
          <p key={p} className="text-sm text-slate-700">
            {p}
          </p>
        ))}
        <p className="text-sm text-slate-700">{ABOUT.developmental}</p>
      </Section>
      <Section title="Who made it">
        <p className="text-sm text-slate-700">{BRANDING.attribution}</p>
        <p className="text-sm text-slate-700">{ABOUT.relationship}</p>
      </Section>
      <Section title="Responsibility for decisions">
        <p className="text-sm text-slate-700">{ABOUT.responsibility}</p>
      </Section>
      <Section title="Licences">
        <ul className="list-disc space-y-1 pl-6 text-sm text-slate-700">
          <li>
            Software:{' '}
            <a className={link} href={LICENCES.code.url}>
              {LICENCES.code.name}
            </a>{' '}
            ({LICENCES.code.spdx}).
          </li>
          <li>
            Educational content:{' '}
            <a className={link} href={LICENCES.content.url}>
              {LICENCES.content.name}
            </a>{' '}
            (CC BY-SA 4.0).
          </li>
          <li>The GenAI:N3 name and brand assets are not openly licensed.</li>
          <li>
            Reviews and statements you create are yours and are not covered by these licences.
          </li>
        </ul>
        <p className="text-sm text-slate-700">
          Read the{' '}
          <Link className={link} to="/licensing">
            licensing details
          </Link>{' '}
          and how{' '}
          <Link className={link} to="/privacy">
            your data is stored
          </Link>
          . The source code is at{' '}
          <a className={link} href={BRANDING.repositoryUrl}>
            {BRANDING.repositoryUrl.replace('https://', '')}
          </a>
          .
        </p>
      </Section>
      <Section title="Feedback">
        <p className="text-sm text-slate-700">{ABOUT.feedbackIntro}</p>
        <p className="text-sm text-slate-700">
          Email{' '}
          <a className={link} href={feedbackMailto()}>
            {BRANDING.feedback.email}
          </a>
          .
        </p>
      </Section>
      <Section title="Version">
        <p className="text-sm text-slate-700">Application version {versionLabel(APP_VERSION)}.</p>
      </Section>
    </>
  )
}
