'use client'

export default function AnswerYesSection() {
  const items = [
    'Can I prevent our clients from seeing unfinished work?',
    'Can I link up files from Google Docs, Figma, Dropbox, Airtable, and other apps?',
    'Can I see everything I need to do on a single screen?',
    "Can I see everything that's overdue on a single screen?",
    'Can I use Basecamp even if some of my team prefers just to use email?',
    'Can I see all the work that was completed on any given day?',
    'Can I set up projects that only some of my team can see?',
    "Can I see everything that's happened across multiple projects in one place?",
    "Can I @mention someone so they're notified about something?",
  ]

  const Sticky = ({ children }: { children: string }) => (
    <span
      style={{
        background: '#ffe600',
        padding: '4px 12px',
        transform: 'rotate(-2deg)',
        display: 'inline-block',
        fontFamily: 'Marker Felt, Comic Sans MS, cursive',
        fontSize: '2rem',
        fontWeight: 900,
        letterSpacing: '1px',
        color: '#111',
        textTransform: 'uppercase',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      }}
    >
      {children}
    </span>
  )

  return (
    <section className="bg-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black mb-4">
          The answer is{' '}
          <Sticky>YES!</Sticky>
        </h2>
        <p className="text-xl md:text-2xl text-black mb-2">
          Can software be simple, straightforward, and easy, yet powerful full-featured?
        </p>
        <p className="text-xl md:text-2xl text-black mb-8">
          With Basecamp the answer is absolutely <strong>YES!</strong>
        </p>
        <ul className="space-y-4">
          {items.map((question, idx) => (
            <li key={idx} className="flex items-start text-lg md:text-xl text-black">
              <span className="mr-3 text-green-600 text-2xl">✔︎</span>
              <span className="font-medium flex-1" dangerouslySetInnerHTML={{ __html: question.replace(/(Can I [^?]*\?)?/, (match)=> match.replace(/\b(.*?)(?=\?)/, '<strong>$1</strong>')) }} />
              <span className="ml-3"><Sticky>YES!</Sticky></span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
} 