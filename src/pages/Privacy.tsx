import { PageTitle, Section } from '../components/fields'
import { PRIVACY } from '../content/about'

export function PrivacyPage() {
  return (
    <>
      <PageTitle title={PRIVACY.title} lede={PRIVACY.lede} />
      {PRIVACY.sections.map((s) => (
        <Section key={s.heading} title={s.heading}>
          <ul className="list-disc space-y-1 pl-6 text-sm text-slate-700">
            {s.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      ))}
    </>
  )
}
