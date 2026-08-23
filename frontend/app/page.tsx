"use client";

import { useState } from "react";

interface Lead {
  company_name: string;
  email: string;
  industry: string;
  decision_maker: string;
  website: string;
}

export default function LeadDashboard() {
  const [description, setDescription] = useState("");
  const [numLeads, setNumLeads] = useState(3);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setLeads([]);

    try {
      const response = await fetch("http://localhost:8000/api/leads/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description, num_leads: numLeads }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch leads. Please check the backend.");
      }

      const data = await response.json();
      setLeads(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-neutral-200">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-100 mb-8">NameKard Lead Searcher</h1>

        <form onSubmit={handleSearch} className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 shadow-sm mb-8 flex gap-4 items-center">

          {/* Unified Search Bar Wrapper */}
          <div className="flex-1 flex items-center bg-neutral-950 border border-neutral-700 rounded-full px-4 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-colors">

            {/* Text Input */}
            <input
              type="text"
              required
              placeholder="e.g., Boutique marketing agencies in Austin"
              className="flex-1 py-2 bg-transparent text-neutral-100 placeholder-neutral-600 outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Subtle Divider Line */}
            <div className="h-5 w-px bg-neutral-700 mx-3"></div>

            {/* Custom Max Leads Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 py-2 pl-2 pr-6 text-neutral-100 outline-none cursor-pointer focus:outline-none"
              >
                <span className="text-sm font-medium text-neutral-400">Max</span>
                <span className="font-medium min-w-[20px]">{numLeads}</span>

                {/* Animated Arrow */}
                <svg
                  className={`w-4 h-4 text-neutral-400 absolute right-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* The Dropdown Menu Box */}
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
                          ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                          : 'text-neutral-200 hover:bg-neutral-800'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Submit Button (Changed to rounded-full to match the bar) */}
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 px-6 py-2 rounded-full font-bold disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {loading ? "Searching..." : "Find Leads"}
          </button>
        </form>

        {error && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 p-4 rounded-md mb-8">
            {error}
          </div>
        )}

        {leads.length > 0 && (
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
                {leads.map((lead, index) => (
                  <tr key={index} className="hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-neutral-200">{lead.company_name}</div>
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-400 hover:text-sky-300 hover:underline">
                        Website
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{lead.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{lead.decision_maker}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{lead.industry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}