/** Text for the About, Privacy and Data Storage, and Licensing pages. */

export const ABOUT = {
  title: 'About AI Integration Review',
  purpose: [
    'AI Integration Review helps programme teams and educators reflect on how AI is addressed in learning outcomes, teaching, assessment and graduate capabilities. It supports educational discussion, curriculum and assessment design, programme coherence and responsible use of AI.',
    'It offers a Programme AI Integration Review and a Module AI Integration Review, which can be used on their own or together, and a Programme AI Integration Statement that a programme team drafts, edits and agrees.',
  ],
  developmental:
    'The tool is developmental and continues to evolve in response to feedback. It is not an AI detector, a compliance certification, a ranking or an endorsement mechanism.',
  relationship:
    'AI Integration Review is a GenAI:N3 resource. It is a public, institution-neutral edition of the SETU AI Integration Review and is maintained independently of it.',
  responsibility:
    'Decisions and approvals made with the tool belong to the institution and programme team concerned. When a statement is marked “Agreed”, that records agreement through the team’s own process. It does not mean GenAI:N3 has endorsed, approved or certified the statement, the review or the programme.',
  feedbackIntro:
    'Feedback and reports of problems are welcome. The email opens in your own mail program, and nothing from your reviews is added to it.',
}

export const PRIVACY = {
  title: 'Privacy and data storage',
  lede: 'How AI Integration Review stores your work and what it does and does not share.',
  sections: [
    {
      heading: 'Where your reviews are stored',
      items: [
        'Review content is stored only in your web browser, on the device you are using, in the browser’s local storage.',
        'There is no application database and no user account. Nobody else can see your reviews unless you share a file.',
        'Reviews are not automatically sent to GenAI:N3, to the website’s hosting provider or to anyone else as part of using the tool.',
      ],
    },
    {
      heading: 'When work can be lost',
      items: [
        'Clearing your browser data (cookies and site data) deletes the reviews saved in that browser.',
        'Reviews do not move between browsers or devices by themselves.',
        'In a private or incognito window, reviews may be deleted when the window closes, and some browsers block saving altogether. The tool warns you when it cannot save.',
        'If the browser’s storage is full, the tool warns you that your latest changes have not been saved.',
      ],
    },
    {
      heading: 'Backups',
      items: [
        'Export a JSON backup regularly, especially before clearing browser data or changing browser or device.',
        'Export a single review from inside it, or every review at once with “Export data” on the home page. Import a file from the home page to open it again.',
      ],
    },
    {
      heading: 'What you share',
      items: [
        'You decide what to share. Exported files and copied or printed statements contain whatever you entered, including any names or institution details.',
        'The feedback email link includes only the tool’s version number in the subject. It never adds review content or personal details.',
      ],
    },
    {
      heading: 'The website itself',
      items: [
        'Like any website, the hosting provider may keep ordinary technical access logs (for example IP addresses and the pages requested) to run and secure the service.',
        'The tool uses no third-party analytics, advertising trackers, remote fonts or remote AI services. Adding any of these would need separate approval and a privacy review first.',
        'The tool does not encrypt stored reviews and makes no claim of formal institutional compliance. Use your institution’s guidance on what information to enter.',
      ],
    },
  ],
}

export const LICENSING = {
  title: 'Licensing',
  lede: 'AI Integration Review is openly licensed. Different licences apply to the software, the educational content and the GenAI:N3 brand.',
  code: 'The application source code is licensed under the GNU General Public License, version 3 or (at your option) any later version (GPL-3.0-or-later).',
  content:
    'The original educational framework, review questions, guidance and documentation are licensed under Creative Commons Attribution–ShareAlike 4.0 International (CC BY-SA 4.0). When reusing them, credit the attribution below, link to the source and indicate any changes.',
  brand:
    'The GenAI:N3 name, logos and identifying brand assets are not covered by either licence; all rights are reserved. Adaptations must not suggest that GenAI:N3 endorses them or anything produced with them.',
  userContent:
    'Reviews, statements and other content you create with the tool are yours (or your institution’s). They are not licensed under the tool’s software or content licences.',
  thirdParty:
    'The tool includes open-source packages, each under its own licence. Their notices are listed in THIRD-PARTY-NOTICES.md in the source repository.',
}
