import { Link } from 'react-router-dom'
import { BRANDING, feedbackMailto, versionLabel } from '../../config/branding'

const link = 'underline-offset-2 hover:underline focus-visible:underline'

export function Footer() {
  return (
    <footer className="no-print border-t border-slate-200 bg-white px-4 py-4 text-xs text-slate-600 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2">
        <p>
          {BRANDING.title} · {BRANDING.publisher} · {versionLabel()}
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            <li>
              <Link className={link} to="/about">
                About
              </Link>
            </li>
            <li>
              <Link className={link} to="/privacy">
                Privacy and data storage
              </Link>
            </li>
            <li>
              <Link className={link} to="/licensing">
                Licensing
              </Link>
            </li>
            <li>
              <a className={link} href={feedbackMailto()}>
                Feedback / Report an issue
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
