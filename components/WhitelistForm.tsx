"use client";

import { useMemo, useState } from "react";
import InfectionMeter from "./InfectionMeter";
import type { SiteConfig } from "@/lib/config";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const STATUS_URL_RE = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
const X_HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

// how long the checkbox stays locked after the user clicks the action link
const UNLOCK_DELAY_MS = 5000;

type Step = "followed" | "liked" | "retweeted" | "quoted";

export default function WhitelistForm({ config }: { config: SiteConfig }) {
  const [xHandle, setXHandle] = useState("");
  const [checks, setChecks] = useState<Record<Step, boolean>>({
    followed: false,
    liked: false,
    retweeted: false,
    quoted: false,
  });
  const [unlocked, setUnlocked] = useState<Record<Step, boolean>>({
    followed: false,
    liked: false,
    retweeted: false,
    quoted: false,
  });
  const [wallet, setWallet] = useState("");
  const [quotePostUrl, setQuotePostUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const STEPS: { key: Step; label: string; action: string; href: string }[] =
    useMemo(
      () => [
        {
          key: "followed",
          label: "Follow the host",
          action: `Follow @${config.xUsername}`,
          href: `https://twitter.com/intent/follow?screen_name=${config.xUsername}`,
        },
        {
          key: "liked",
          label: "Absorb the signal",
          action: "Like the pinned post",
          href: `https://twitter.com/intent/like?tweet_id=${config.tweetId}`,
        },
        {
          key: "retweeted",
          label: "Spread the outbreak",
          action: "Retweet the pinned post",
          href: `https://twitter.com/intent/retweet?tweet_id=${config.tweetId}`,
        },
        {
          key: "quoted",
          label: 'Mark patient "zero"',
          action: 'Quote the post and say "zero"',
          href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            "zero"
          )}&url=${encodeURIComponent(config.tweetUrl)}`,
        },
      ],
      [config]
    );

  const completedCount = Object.values(checks).filter(Boolean).length;
  const handleValid = X_HANDLE_RE.test(xHandle.trim().replace(/^@/, ""));
  const walletValid = EVM_ADDRESS_RE.test(wallet.trim());
  const quotePostValid = STATUS_URL_RE.test(quotePostUrl.trim());

  const canSubmit = useMemo(
    () =>
      handleValid &&
      completedCount === STEPS.length &&
      walletValid &&
      quotePostValid &&
      !submitting,
    [handleValid, completedCount, walletValid, quotePostValid, submitting, STEPS]
  );

  function handleStepLinkClick(step: Step) {
    // checkbox stays locked until a few seconds after the user actually
    // clicks through to the post - keeps the self-report honest-ish
    setTimeout(() => {
      setUnlocked((u) => ({ ...u, [step]: true }));
    }, UNLOCK_DELAY_MS);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setResult("idle");
    setErrorMsg("");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xUsername: xHandle.trim().replace(/^@/, ""),
          wallet: wallet.trim(),
          followed: checks.followed,
          liked: checks.liked,
          retweeted: checks.retweeted,
          quoted: checks.quoted,
          quotePostUrl: quotePostUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setResult("success");
    } catch (err: any) {
      setResult("error");
      setErrorMsg(err.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result === "success") {
    return (
      <div className="border border-toxic/40 bg-rot/60 p-8 text-center">
        <p className="text-toxic font-display text-2xl tracking-wide mb-2">
          APPLICATION RECEIVED
        </p>
        <p className="text-bone/70 text-sm leading-relaxed">
          Your infection has been logged for {config.projectName} on
          Robinhood Chain. Watch @{config.xUsername} for the carrier list
          before mint.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <InfectionMeter completed={completedCount} total={STEPS.length} />

      {/* X handle - self-reported, no login required */}
      <div className="space-y-2">
        <p className="text-bone/60 tracking-widest text-xs">
          YOUR X HANDLE (no @)
        </p>
        <input
          value={xHandle}
          onChange={(e) => setXHandle(e.target.value)}
          placeholder="your_handle"
          className="w-full bg-rot/40 border border-toxicDim/30 px-3 py-2 text-sm text-bone placeholder:text-bone/30 focus:border-toxic outline-none font-mono"
        />
        {xHandle.length > 0 && !handleValid && (
          <p className="text-wound text-xs">
            X handles are 1-15 characters, letters/numbers/underscore only.
          </p>
        )}
      </div>

      {/* Task steps */}
      <div className="space-y-3">
        <p className="text-bone/60 tracking-widest text-xs">
          INFECTION PROTOCOL
        </p>
        {STEPS.map((step, i) => {
          const isUnlocked = unlocked[step.key];
          return (
            <div
              key={step.key}
              className="border border-toxicDim/30 bg-rot/40 p-4 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="flex items-start gap-3">
                <span className="font-display text-toxic/70 text-lg leading-none pt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-bone text-sm">{step.label}</p>
                  <a
                    href={step.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleStepLinkClick(step.key)}
                    className="text-xs text-toxic/80 hover:text-toxic underline underline-offset-4"
                  >
                    {step.action} ↗
                  </a>
                </div>
              </div>
              <label
                className={`flex items-center gap-2 text-xs select-none ${
                  isUnlocked ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                title={
                  isUnlocked
                    ? undefined
                    : "Click the link first, then wait a few seconds"
                }
              >
                <input
                  type="checkbox"
                  checked={checks[step.key]}
                  disabled={!isUnlocked}
                  onChange={(e) =>
                    setChecks((c) => ({ ...c, [step.key]: e.target.checked }))
                  }
                  className="accent-toxic w-4 h-4 disabled:opacity-30"
                />
                <span
                  className={isUnlocked ? "text-bone/70" : "text-bone/30"}
                >
                  {isUnlocked ? "done" : "locked"}
                </span>
              </label>
            </div>
          );
        })}
      </div>

      {/* Quote post link - one post, one link, both friends tagged in it */}
      <div className="space-y-2">
        <p className="text-bone/60 tracking-widest text-xs">
          LINK TO YOUR QUOTE POST (tag 2 survivors in it)
        </p>
        <input
          value={quotePostUrl}
          onChange={(e) => setQuotePostUrl(e.target.value)}
          placeholder="https://x.com/you/status/..."
          className="w-full bg-rot/40 border border-toxicDim/30 px-3 py-2 text-sm text-bone placeholder:text-bone/30 focus:border-toxic outline-none font-mono"
        />
        {quotePostUrl.length > 0 && !quotePostValid && (
          <p className="text-wound text-xs">
            Paste the full link to your quote post.
          </p>
        )}
      </div>

      {/* Wallet */}
      <div className="space-y-2">
        <p className="text-bone/60 tracking-widest text-xs">
          WALLET ADDRESS (Robinhood Chain)
        </p>
        <input
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="0x..."
          className="w-full bg-rot/40 border border-toxicDim/30 px-3 py-2 text-sm text-bone placeholder:text-bone/30 focus:border-toxic outline-none font-mono"
        />
        {wallet.length > 0 && !walletValid && (
          <p className="text-wound text-xs">
            That's not a valid EVM address.
          </p>
        )}
      </div>

      {result === "error" && (
        <p className="text-wound text-sm">{errorMsg}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full bg-toxic text-void font-display tracking-widest text-lg py-3 disabled:bg-murk disabled:text-bone/30 disabled:cursor-not-allowed hover:bg-bone transition-colors"
      >
        {submitting ? "LOGGING INFECTION..." : "SUBMIT APPLICATION"}
      </button>
    </div>
  );
}
