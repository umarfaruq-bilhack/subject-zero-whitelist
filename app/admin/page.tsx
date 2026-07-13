"use client";

import { useState } from "react";

type Application = {
  id: string;
  x_id: string;
  x_username: string;
  wallet_address: string;
  followed: boolean;
  liked: boolean;
  retweeted: boolean;
  quoted: boolean;
  quote_post_url: string;
  created_at: string;
};

type Config = {
  project_name: string;
  x_username: string;
  tweet_id: string;
  tweet_url: string;
  applications_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
};

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in local time, not ISO
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [apps, setApps] = useState<Application[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(token: string) {
    setLoading(true);
    setError("");
    try {
      const [appsRes, configRes] = await Promise.all([
        fetch("/api/admin/applications", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/config", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const appsData = await appsRes.json();
      const configData = await configRes.json();
      if (!appsRes.ok) throw new Error(appsData.error || "Failed to load");
      if (!configRes.ok) throw new Error(configData.error || "Failed to load");
      setApps(appsData.applications);
      setConfig(configData.config);
      setAuthed(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    if (!config) return;
    setSavingConfig(true);
    setConfigSaved(false);
    setError("");
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          projectName: config.project_name,
          xUsername: config.x_username,
          tweetUrl: config.tweet_url,
          applicationsOpen: config.applications_open,
          opensAt: config.opens_at,
          closesAt: config.closes_at,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingConfig(false);
    }
  }

  function exportCsv() {
    const headers = [
      "x_username",
      "wallet_address",
      "quote_post_url",
      "created_at",
    ];
    const rows = apps.map((a) =>
      headers.map((h) => `"${(a as any)[h]}"`).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "whitelist_applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-void px-6">
        <div className="max-w-sm w-full space-y-4">
          <p className="text-bone/60 text-xs tracking-widest">
            ADMIN ACCESS
          </p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="admin secret"
            className="w-full bg-rot/40 border border-toxicDim/30 px-3 py-2 text-sm text-bone outline-none focus:border-toxic"
          />
          <button
            onClick={() => load(secret)}
            disabled={loading}
            className="w-full bg-toxic text-void font-display tracking-widest py-2"
          >
            {loading ? "CHECKING..." : "ENTER"}
          </button>
          {error && <p className="text-wound text-sm">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Settings */}
        <div>
          <h1 className="font-display text-3xl text-bone mb-4">SETTINGS</h1>
          {config && (
            <div className="border border-toxicDim/30 bg-rot/40 p-5 space-y-4 max-w-lg">
              <div className="space-y-1">
                <label className="block text-bone/60 text-xs tracking-widest">
                  PROJECT NAME
                </label>
                <input
                  value={config.project_name}
                  onChange={(e) =>
                    setConfig({ ...config, project_name: e.target.value })
                  }
                  className="w-full bg-void border border-toxicDim/30 px-3 py-2 text-sm text-bone outline-none focus:border-toxic"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-bone/60 text-xs tracking-widest">
                  X USERNAME (no @, no link — just the handle)
                </label>
                <input
                  value={config.x_username}
                  onChange={(e) =>
                    setConfig({ ...config, x_username: e.target.value })
                  }
                  placeholder="subject_0"
                  className="w-full bg-void border border-toxicDim/30 px-3 py-2 text-sm text-bone outline-none focus:border-toxic font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-bone/60 text-xs tracking-widest">
                  TWEET URL (the post people follow/like/RT/quote)
                </label>
                <input
                  value={config.tweet_url}
                  onChange={(e) =>
                    setConfig({ ...config, tweet_url: e.target.value })
                  }
                  placeholder="https://x.com/subject_0/status/1234567890"
                  className="w-full bg-void border border-toxicDim/30 px-3 py-2 text-sm text-bone outline-none focus:border-toxic font-mono"
                />
                <p className="text-bone/30 text-xs">
                  Paste the whole link — the tweet ID is pulled out
                  automatically, you don't need to enter it separately.
                </p>
              </div>

              <div className="border-t border-toxicDim/20 pt-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.applications_open}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        applications_open: e.target.checked,
                      })
                    }
                    className="accent-toxic w-4 h-4"
                  />
                  <span className="text-bone text-sm">
                    Applications open
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 ${
                      config.applications_open
                        ? "text-toxic bg-toxic/10"
                        : "text-wound bg-wound/10"
                    }`}
                  >
                    {config.applications_open ? "LIVE" : "CLOSED"}
                  </span>
                </label>
                <p className="text-bone/30 text-xs -mt-2">
                  Turn this off any time to close the form instantly,
                  regardless of the schedule below.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-bone/60 text-xs tracking-widest">
                      OPENS AT (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={toLocalInputValue(config.opens_at)}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          opens_at: fromLocalInputValue(e.target.value),
                        })
                      }
                      className="w-full bg-void border border-toxicDim/30 px-3 py-2 text-sm text-bone outline-none focus:border-toxic"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-bone/60 text-xs tracking-widest">
                      CLOSES AT (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={toLocalInputValue(config.closes_at)}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          closes_at: fromLocalInputValue(e.target.value),
                        })
                      }
                      className="w-full bg-void border border-toxicDim/30 px-3 py-2 text-sm text-bone outline-none focus:border-toxic"
                    />
                  </div>
                </div>
                <p className="text-bone/30 text-xs">
                  Leave either blank to skip that boundary. Both are in your
                  browser's local time. The switch above must be on for
                  either of these to matter.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={saveConfig}
                  disabled={savingConfig}
                  className="bg-toxic text-void text-xs font-semibold tracking-widest px-4 py-2"
                >
                  {savingConfig ? "SAVING..." : "SAVE SETTINGS"}
                </button>
                {configSaved && (
                  <span className="text-toxic text-xs">
                    Saved — live on the site now.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Applications */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="font-display text-3xl text-bone">
              APPLICATIONS ({apps.length})
            </h2>
            <button
              onClick={exportCsv}
              className="bg-toxic text-void text-xs font-semibold tracking-widest px-4 py-2"
            >
              EXPORT CSV
            </button>
          </div>
          <div className="overflow-x-auto border border-toxicDim/30">
            <table className="w-full text-xs text-left">
              <thead className="bg-rot/60 text-bone/50">
                <tr>
                  <th className="p-3">X</th>
                  <th className="p-3">Wallet</th>
                  <th className="p-3">Quote post</th>
                  <th className="p-3">Steps</th>
                  <th className="p-3">Applied</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-t border-toxicDim/10">
                    <td className="p-3 text-toxic">@{a.x_username}</td>
                    <td className="p-3 font-mono text-bone/70">
                      {a.wallet_address}
                    </td>
                    <td className="p-3">
                      <a
                        href={a.quote_post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-toxic/80 hover:text-toxic underline underline-offset-4"
                      >
                        view ↗
                      </a>
                    </td>
                    <td className="p-3 text-bone/50">
                      {[a.followed, a.liked, a.retweeted, a.quoted].filter(
                        Boolean
                      ).length}
                      /4
                    </td>
                    <td className="p-3 text-bone/40">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
