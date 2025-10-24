"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BookmarkTimeline } from "@/src/features/timeline/components/BookmarkTimeline";
import { computeVisuals, getGoogleFaviconUrl } from "@/lib/favicon-utils";

// Kanban v2 is heavy; import client-side only
const KanbanBoard2 = dynamic(() => import("@/src/features/kanban/components/KanbanBoard2").then(m => m.KanbanBoard2), { ssr: false });

// Lightweight dashboard-like card demo that mirrors our priority rules
function DashboardCardsDemo({ bookmarks, globalLogo }: { bookmarks: any[]; globalLogo?: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {bookmarks.map((bm, idx) => {
        const { background, largeCircle, smallFavicon } = computeVisuals(bm, globalLogo);
        return (
          <div key={idx} data-testid={`dash-card-${idx}`} className="relative rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/40 dark:border-gray-800/60 p-6">
            {/* Background visual */}
            <div
              data-testid={`dash-bg-${idx}`}
              className="absolute inset-0 bg-center bg-no-repeat opacity-10 pointer-events-none"
              style={{ backgroundImage: `url(${background})`, backgroundSize: "140% 140%" }}
            />
            <div className="relative flex items-center space-x-4">
              {/* Large circle */}
              <img
                data-testid={`dash-circle-${idx}`}
                src={largeCircle}
                alt=""
                className="w-14 h-14 rounded-full border border-gray-200/60 dark:border-gray-800/60 bg-gray-100 dark:bg-gray-800 object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = bm.favicon || (bm.url ? getGoogleFaviconUrl(bm.url, 64) : "/favicon.ico"); }}
              />
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <img data-testid={`dash-favicon-${idx}`} src={smallFavicon} alt="" className="w-4 h-4" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{bm.title || "Untitled"}</h3>
                </div>
                <p className="text-xs text-gray-500 truncate">{bm.url}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LogoVisualDemoPage() {
  const [globalLogo, setGlobalLogo] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const val = localStorage.getItem("dna_profile_avatar") || undefined;
      setGlobalLogo(val || undefined);
    } catch {}
  }, []);

  const setGlobal = (url: string) => {
    try {
      localStorage.setItem("dna_profile_avatar", url);
      setGlobalLogo(url);
    } catch {}
  };
  const clearGlobal = () => {
    try {
      localStorage.removeItem("dna_profile_avatar");
      setGlobalLogo(undefined);
    } catch {}
  };

  // Sample bookmarks covering all permutations and both snake_case/camelCase
  const bookmarks: any[] = useMemo(() => ([
    // 0: custom background + custom logo + custom favicon
    {
      id: "custom-all",
      title: "Custom All",
      url: "https://example.com/custom-all",
      custom_background: "https://logo.clearbit.com/vercel.com",
      custom_logo: "https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png",
      custom_favicon: "https://logo.clearbit.com/vercel.com",
      favicon: "https://www.google.com/s2/favicons?domain=vercel.com&sz=64",
    },
    // 1: only custom logo
    {
      id: "custom-logo",
      title: "Custom Logo Only",
      url: "https://example.com/custom-logo",
      customLogo: "https://logo.clearbit.com/github.com",
    },
    // 2: only custom background
    {
      id: "custom-bg",
      title: "Custom Background Only",
      url: "https://example.com/custom-bg",
      customBackground: "https://logo.clearbit.com/stackoverflow.com",
    },
    // 3: only custom favicon
    {
      id: "custom-favicon",
      title: "Custom Favicon Only",
      url: "https://example.com/custom-favicon",
      custom_favicon: "https://logo.clearbit.com/npmjs.com",
    },
    // 4: extracted favicon only
    {
      id: "extracted-only",
      title: "Extracted Favicon",
      url: "https://github.com",
      favicon: "https://github.githubassets.com/favicons/favicon.png",
    },
    // 5: nothing (falls back to Google service)
    {
      id: "fallback-google",
      title: "Google Fallback",
      url: "https://developer.mozilla.org",
    },
  ]), []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-10">
      <header className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">Logo / Favicon Visual Demo</h1>
        <p className="text-sm text-gray-400">Public page to verify the comprehensive priority system without auth</p>
        <div className="mt-4 flex items-center gap-3">
          <button
            data-testid="btn-set-global"
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded"
            onClick={() => setGlobal("https://logo.clearbit.com/openai.com")}
          >
            Set Global DNA Logo
          </button>
          <button
            data-testid="btn-clear-global"
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded"
            onClick={clearGlobal}
          >
            Clear Global DNA Logo
          </button>
          <span className="text-xs text-gray-400">Current: {globalLogo ? globalLogo : "none"}</span>
        </div>
      </header>

      <section className="max-w-6xl mx-auto space-y-4">
        <h2 className="text-lg font-semibold">Dashboard Cards (Demo)</h2>
        <DashboardCardsDemo bookmarks={bookmarks} globalLogo={globalLogo} />
      </section>

      <section className="max-w-6xl mx-auto space-y-4">
        <h2 className="text-lg font-semibold">Kanban v2 (small favicons priority)</h2>
        <div className="rounded-xl border border-gray-800">
          <KanbanBoard2 bookmarks={bookmarks} />
        </div>
        {/* Explicit favicon list to assert chain without depending on Kanban internals */}
        <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {bookmarks.map((bm, i) => {
            const src = bm.custom_favicon || bm.favicon || (bm.url ? getGoogleFaviconUrl(bm.url, 64) : '/favicon.ico');
            return (
              <li key={`k2-fav-${i}`} className="flex items-center gap-2 text-xs text-gray-300">
                <img data-testid={`kanban2-fav-${i}`} src={src} alt="" className="w-5 h-5" />
                <span className="truncate">{bm.title}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="max-w-6xl mx-auto space-y-4">
        <h2 className="text-lg font-semibold">Timeline (background priority)</h2>
        <div className="rounded-xl border border-gray-800">
          <BookmarkTimeline bookmarks={bookmarks} userDefaultLogo={globalLogo} />
        </div>
      </section>
    </div>
  );
}

