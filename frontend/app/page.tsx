"use client";

import { useState, useEffect } from "react";

interface Lead {
  company_name: string;
  email: string;
  industry: string;
  decision_maker: string;
  website: string;
}

// ── helpers ────────────────────────────────────────────────────────────────
const LS_KEY = "namekard-saved-leads";

function normalizeUrl(url: string): string {
  if (!url) return "#";
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : "https://" + url;
}

function loadSaved(): Lead[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSaved(leads: Lead[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(leads));
}

function makeCSV(leads: Lead[]): string {
  const headers = ["Company", "Email", "Decision Maker", "Industry", "Website"];
  const rows = leads.map((l) => [
    l.company_name, l.email, l.decision_maker, l.industry, l.website,
  ]);
  const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}

function triggerDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── icons ──────────────────────────────────────────────────────────────────
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`w-4 h-4 transition-colors ${filled ? "fill-emerald-400 text-emerald-400" : "fill-none text-neutral-500 hover:text-emerald-400"}`}
    stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// ── LeadRow ────────────────────────────────────────────────────────────────
function LeadRow({
  lead, saved, onToggleSave,
}: {
  lead: Lead; saved: boolean; onToggleSave: (l: Lead) => void;
}) {
  return (
    <tr className="hover:bg-neutral-800/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSave(lead)}
            title={saved ? "Remove from saved" : "Save lead"}
            className="shrink-0"
          >
            <StarIcon filled={saved} />
          </button>
          <div>
            <div className="font-medium text-neutral-200">{lead.company_name}</div>
            <a
              href={normalizeUrl(lead.website)} target="_blank" rel="noopener noreferrer"
              className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              Website
            </a>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{lead.email}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{lead.decision_maker}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{lead.industry}</td>
    </tr>
  );
}

// ── LeadsTable ─────────────────────────────────────────────────────────────
function LeadsTable({
  leads, savedLeads, onToggleSave, onDownload, downloadLabel,
}: {
  leads: Lead[];
  savedLeads: Lead[];
  onToggleSave: (l: Lead) => void;
  onDownload: () => void;
  downloadLabel: string;
}) {
  return (
    <div>
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-800">
          <thead className="bg-neutral-950/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Decision Maker</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Industry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {leads.map((lead, i) => (
              <LeadRow
                key={i}
                lead={lead}
                saved={savedLeads.some((s) => s.website === lead.website)}
                onToggleSave={onToggleSave}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          onClick={onDownload}
          className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <DownloadIcon />
          {downloadLabel}
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
const BACKEND = "https://namekard.onrender.com";

export default function LeadDashboard() {
  const [description, setDescription] = useState("");
  const [numLeads, setNumLeads] = useState(3);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [error, setError] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [excludeSaved, setExcludeSaved] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Load saved leads from localStorage on mount, and ping the backend
  // so Render's cold-start completes before the user hits Search.
  useEffect(() => {
    setSavedLeads(loadSaved());
    fetch(`${BACKEND}/`).catch(() => {});
  }, []);

  const toggleSave = (lead: Lead) => {
    setSavedLeads((prev) => {
      const exists = prev.some((l) => l.website === lead.website);
      const updated = exists
        ? prev.filter((l) => l.website !== lead.website)
        : [...prev, lead];
      persistSaved(updated);
      return updated;
    });
  };

  const clearAllSaved = () => {
    setSavedLeads([]);
    persistSaved([]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsSlow(false);
    setError("");
    setLeads([]);

    // Show a "taking a while" hint after 15 s (Render cold-start / heavy scrape)
    const slowTimer = setTimeout(() => setIsSlow(true), 15000);

    try {
      const response = await fetch(`${BACKEND}/api/leads/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          num_leads: numLeads,
          excluded_websites: excludeSaved ? savedLeads.map((l) => l.website) : [],
        }),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail?.detail ?? "Failed to fetch leads. Please check the backend.");
      }

      const data = await response.json();
      setLeads(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setIsSlow(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const hasSearched = loading || leads.length > 0;

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-200 overflow-hidden">

      {/* 1. The Fixed Sidebar */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-950 flex flex-col p-6 shrink-0">
        <div className="text-2xl font-bold text-neutral-100 mb-10">NameKard</div>

        <nav className="flex flex-col gap-2">
          {/* Main Search Tab */}
          <button
            onClick={() => setShowSaved(false)}
            className={`text-left px-4 py-2 rounded-md font-medium transition-colors ${!showSaved
              ? "bg-neutral-900 text-emerald-400 border border-neutral-800"
              : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent"
              }`}
          >
            Lead Search
          </button>

          {/* Saved Leads Tab (Moved from Header) */}
          <button
            onClick={() => setShowSaved(true)}
            className={`flex items-center justify-between text-left px-4 py-2 rounded-md font-medium transition-colors ${showSaved
              ? "bg-neutral-900 text-emerald-400 border border-neutral-800"
              : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent"
              }`}
          >
            <div className="flex items-center gap-2">
              <StarIcon filled={showSaved} />
              Saved
            </div>
            {savedLeads.length > 0 && (
              <span className="bg-emerald-500 text-neutral-950 text-xs font-bold rounded-full px-2 py-0.5">
                {savedLeads.length}
              </span>
            )}
          </button>
        </nav>
      </aside>

      {/* 2. The Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto p-8 flex flex-col">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">

          {/* Render Search View */}
          {!showSaved && (
            <div
              className={`w-full flex-1 flex flex-col transition-all duration-700 ease-out ${
                hasSearched ? "pt-0" : "justify-center min-h-[70vh] -translate-y-8"
              }`}
            >
              <div className="w-full">
                <h1
                  className={`font-light tracking-tight text-neutral-100 text-center transition-all duration-500 ${
                    hasSearched ? "text-3xl mb-6" : "text-5xl mb-8"
                  }`}
                >
                  Find New Leads
                </h1>

                {/* Search form */}
                <form
                  onSubmit={handleSearch}
                  className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 shadow-sm mb-4 flex gap-4 items-center max-w-4xl mx-auto"
                >
                  <div className="flex-1 flex items-center bg-neutral-950 border border-neutral-700 rounded-full px-4 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-colors">
                    <input
                      type="text"
                      required
                      placeholder="e.g., Boutique marketing agencies in Austin"
                      className="flex-1 py-2 bg-transparent text-neutral-100 placeholder-neutral-600 outline-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />

                    <div className="h-5 w-px bg-neutral-700 mx-3" />

                    {/* Max leads dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-1 py-2 pl-2 pr-6 text-neutral-100 outline-none cursor-pointer focus:outline-none"
                      >
                        <span className="text-sm font-medium text-neutral-400">Max</span>
                        <span className="font-medium min-w-[20px]">{numLeads}</span>
                        <svg
                          className={`w-4 h-4 text-neutral-400 absolute right-1 transition-transform duration-200 ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-3 w-24 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl overflow-hidden z-50 py-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                setNumLeads(num);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-center px-4 py-2 text-sm transition-colors ${
                                numLeads === num
                                  ? "bg-emerald-500/10 text-emerald-400 font-bold"
                                  : "text-neutral-200 hover:bg-neutral-800"
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 px-6 py-2 rounded-full font-bold disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {loading ? "Searching..." : "Find Leads"}
                  </button>
                </form>

                {/* Exclude saved toggle */}
                {savedLeads.length > 0 && (
                  <div className="flex items-center justify-center gap-3 mb-8 px-1">
                    <button
                      type="button"
                      onClick={() => setExcludeSaved((v) => !v)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        excludeSaved ? "bg-emerald-500" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                          excludeSaved ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-neutral-400">
                      Exclude {savedLeads.length} saved lead{savedLeads.length !== 1 ? "s" : ""} from new searches
                    </span>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-950/50 border border-red-900 text-red-400 p-4 rounded-md mb-8 max-w-4xl mx-auto">
                    {error}
                  </div>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-300">
                    <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4" />
                    <p className="text-sm text-neutral-400">Scraping & discovering leads with AI...</p>
                    {isSlow && (
                      <p className="text-xs text-neutral-500 mt-2 animate-in fade-in duration-500">
                        This is taking a while — the server may be warming up. Hang tight...
                      </p>
                    )}
                  </div>
                )}

                {/* Search results */}
                {!loading && leads.length > 0 && (
                  <div className="mb-10 animate-in slide-in-from-bottom-4 duration-500">
                    <p className="text-sm text-neutral-500 mb-3">
                      {leads.length} lead{leads.length !== 1 ? "s" : ""} found — ☆ to save
                    </p>
                    {leads.length < numLeads && (
                      <div className="bg-amber-950/40 border border-amber-800/50 text-amber-400 text-sm px-4 py-2.5 rounded-md mb-3">
                        Only {leads.length} of {numLeads} leads found — try broadening your search description.
                      </div>
                    )}
                    <LeadsTable
                      leads={leads}
                      savedLeads={savedLeads}
                      onToggleSave={toggleSave}
                      onDownload={() => triggerDownload(makeCSV(leads), `namekard-results-${today}.csv`)}
                      downloadLabel="Download Results CSV"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Render Saved Leads View */}
          {showSaved && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-neutral-100 flex items-center gap-3">
                  <StarIcon filled />
                  Saved Leads
                </h2>
                {savedLeads.length > 0 && (
                  <button
                    onClick={clearAllSaved}
                    className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors bg-red-400/10 px-4 py-2 rounded-md"
                  >
                    <TrashIcon />
                    Clear all
                  </button>
                )}
              </div>

              {savedLeads.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center text-neutral-500 flex flex-col items-center gap-4">
                  <StarIcon filled={false} />
                  <p>No saved leads yet. Go to Lead Search and click ☆ on any result to save it here.</p>
                </div>
              ) : (
                <LeadsTable
                  leads={savedLeads}
                  savedLeads={savedLeads}
                  onToggleSave={toggleSave}
                  onDownload={() => triggerDownload(makeCSV(savedLeads), `namekard-saved-${today}.csv`)}
                  downloadLabel="Download Saved CSV"
                />
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}