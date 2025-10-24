import { SafariDemo } from '../../../components/Safari Window/src/components/SafariDemo';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

function InlineThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:scale-110 shadow-md"
      aria-label="Toggle theme"
    >
      <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-yellow-500" />
      <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-500" />
    </button>
  );
}

function AnimatedCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-wrapper">
      {/* Dark/Light mode toggle specific to Safari window */}
      <InlineThemeToggle />
      {/* Sticky note */}
      <div
        className="sticky-note"
        style={{ transform: 'rotate(-6deg)', width: 'max-content' }}
      >
        <div
          className="bg-yellow-300 px-10 py-4 rounded-md shadow-lg border-2 border-yellow-400"
          style={{ fontFamily: 'Marker Felt, Comic Sans MS, cursive', fontSize: '2rem', fontWeight: 900, letterSpacing: '1px', color: '#111', textTransform: 'uppercase', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
        >
          HIT PLAY TO SEE HOW BASECAMP IS DIFFERENT
        </div>
      </div>

      <div className="card">
        <div className="bg" />
        <div className="blob" />
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function VideoSection() {
  return (
    <section className="bg-[#faf8f3] dark:bg-slate-900 py-0 px-0 w-full flex flex-col items-start relative" style={{ minHeight: '900px' }}>
      <div className="w-full flex justify-center items-center" style={{ minHeight: '900px', padding: '200px 200px', position: 'relative' }}>
        <AnimatedCard>
          <SafariDemo />
        </AnimatedCard>
      </div>
      <style jsx global>{`
        .card-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .sticky-note {
          position: absolute;
          top: -48px;
          left: -40px;
          z-index: 20;
        }

        .card {
          position: relative;
          width: 100%;
          max-width: 1220px;
          height: auto;
          min-height: 773px;
          border-radius: 14px;
          z-index: 10;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 20px 20px 60px #bebebe, -20px -20px 60px #ffffff;
        }

        .dark .card {
          box-shadow: 20px 20px 60px #1a1a1a, -20px -20px 60px #404040;
        }

        .bg {
          position: absolute;
          top: 5px;
          left: 5px;
          right: 5px;
          bottom: 5px;
          z-index: 2;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(24px);
          border-radius: 10px;
          overflow: hidden;
          outline: 2px solid white;
        }

        .dark .bg {
          background: rgba(15, 23, 42, 0.95);
          outline: 2px solid rgba(255, 255, 255, 0.1);
        }

        .blob {
          position: absolute;
          z-index: 1;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: linear-gradient(45deg, #ec4899, #8b5cf6, #d946ef);
          opacity: 1;
          filter: blur(12px);
          animation: blob-bounce 12s infinite linear;
        }

        .dark .blob {
          background: linear-gradient(45deg, #f472b6, #a855f7, #e879f9);
        }

        .content {
          position: relative;
          z-index: 3;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes blob-bounce {
          0% {
            top: -75px;
            left: -75px;
          }
          12.5% {
            top: -75px;
            left: 50%;
            transform: translateX(-50%);
          }
          25% {
            top: -75px;
            left: calc(100% + 75px);
            transform: translateX(-100%);
          }
          37.5% {
            top: 50%;
            left: calc(100% + 75px);
            transform: translate(-100%, -50%);
          }
          50% {
            top: calc(100% + 75px);
            left: calc(100% + 75px);
            transform: translate(-100%, -100%);
          }
          62.5% {
            top: calc(100% + 75px);
            left: 50%;
            transform: translate(-50%, -100%);
          }
          75% {
            top: calc(100% + 75px);
            left: -75px;
          }
          87.5% {
            top: 50%;
            left: -75px;
            transform: translateY(-50%);
          }
          100% {
            top: -75px;
            left: -75px;
          }
        }

        /* Gradient halo around the card */
        .card-wrapper::before {
          content: '';
          position: absolute;
          inset: -8px; /* extend slightly beyond card edges */
          border-radius: 20px;
          background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #ec4899 100%);
          filter: blur(30px);
          opacity: 0.6;
          z-index: 5; /* behind .card (z-index 10) but above page background */
          pointer-events: none;
        }

        /* Slightly different hue for dark mode for better contrast */
        .dark .card-wrapper::before {
          background: linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #f472b6 100%);
          opacity: 0.8;
        }
      `}</style>
    </section>
  );
}
