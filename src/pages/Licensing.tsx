import { PageTitle, Section } from '../components/fields'
import { BRANDING, LICENCES } from '../config/branding'
import { LICENSING } from '../content/about'

const link = 'font-medium text-brand-700 underline'

export function LicensingPage() {
  return (
    <>
      <PageTitle title={LICENSING.title} lede={LICENSING.lede} />
      <Section title="Software">
        <p className="text-sm text-slate-700">{LICENSING.code}</p>
        <p className="text-sm">
          <a className={link} href={LICENCES.code.url}>
            Read the {LICENCES.code.name}
          </a>
        </p>
      </Section>
      <Section title="Educational content">
        <p className="text-sm text-slate-700">{LICENSING.content}</p>
        <blockquote className="border-l-4 border-brand-500 pl-3 text-sm text-slate-800">
          {BRANDING.title}: {BRANDING.publisher}. {BRANDING.attribution}
        </blockquote>
        <p className="text-sm">
          <a className={link} href={LICENCES.content.url}>
            Read the {LICENCES.content.name} licence
          </a>
        </p>
      </Section>
      <Section title="GenAI:N3 name and brand">
        <p className="text-sm text-slate-700">{LICENSING.brand}</p>
      </Section>
      <Section title="Your reviews and statements">
        <p className="text-sm text-slate-700">{LICENSING.userContent}</p>
      </Section>
      <Section title="Third-party software">
        <p className="text-sm text-slate-700">{LICENSING.thirdParty}</p>
        <p className="text-sm">
          <a className={link} href={`${BRANDING.repositoryUrl}/blob/main/THIRD-PARTY-NOTICES.md`}>
            Third-party notices
          </a>
        </p>
      </Section>
    </>
  )
}
