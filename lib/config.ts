import { createClient } from "@supabase/supabase-js";

export type SiteConfig = {
  projectName: string;
  xUsername: string;
  tweetId: string;
  tweetUrl: string;
  applicationsOpen: boolean;
  opensAt: string | null; // ISO timestamp or null
  closesAt: string | null; // ISO timestamp or null
  isOpen: boolean; // computed effective status right now
  statusMessage: string; // human-readable reason when closed
};

const DEFAULTS: SiteConfig = {
  projectName: process.env.NEXT_PUBLIC_PROJECT_NAME || "OUTBREAK",
  xUsername: process.env.NEXT_PUBLIC_X_USERNAME || "youraccount",
  tweetId: process.env.NEXT_PUBLIC_TWEET_ID || "0000000000000000000",
  tweetUrl: process.env.NEXT_PUBLIC_TWEET_URL || "",
  applicationsOpen: true,
  opensAt: null,
  closesAt: null,
  isOpen: true,
  statusMessage: "",
};

// Given the raw admin-set fields, work out whether applications are open
// right now and why, if not. The manual switch is a hard override - if
// it's off, nothing else matters. Otherwise the optional schedule applies.
export function computeStatus(
  applicationsOpen: boolean,
  opensAt: string | null,
  closesAt: string | null
): { isOpen: boolean; statusMessage: string } {
  if (!applicationsOpen) {
    return { isOpen: false, statusMessage: "Applications are currently closed." };
  }
  const now = new Date();
  if (opensAt && now < new Date(opensAt)) {
    return {
      isOpen: false,
      statusMessage: `Applications open ${new Date(opensAt).toLocaleString()}.`,
    };
  }
  if (closesAt && now > new Date(closesAt)) {
    return { isOpen: false, statusMessage: "Applications have closed." };
  }
  return { isOpen: true, statusMessage: "" };
}

// Reads live branding/task/schedule config from Supabase so it can be
// changed from /admin without a redeploy. Falls back to .env.local
// defaults if the row doesn't exist yet or Supabase isn't configured.
export async function getSiteConfig(): Promise<SiteConfig> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return DEFAULTS;
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          // Next.js patches global fetch and caches it by default even
          // when the page is force-dynamic - explicitly opt this request
          // out so config changes show up immediately, not on some
          // arbitrary cached schedule.
          fetch: (url, options) =>
            fetch(url, { ...options, cache: "no-store" }),
        },
      }
    );
    const { data, error } = await supabase
      .from("site_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return DEFAULTS;

    const projectName = data.project_name || DEFAULTS.projectName;
    const xUsername = data.x_username || DEFAULTS.xUsername;
    const tweetId = data.tweet_id || DEFAULTS.tweetId;
    const tweetUrl =
      data.tweet_url || `https://twitter.com/${xUsername}/status/${tweetId}`;
    const applicationsOpen =
      data.applications_open === null || data.applications_open === undefined
        ? true
        : data.applications_open;
    const opensAt = data.opens_at || null;
    const closesAt = data.closes_at || null;
    const { isOpen, statusMessage } = computeStatus(
      applicationsOpen,
      opensAt,
      closesAt
    );

    return {
      projectName,
      xUsername,
      tweetId,
      tweetUrl,
      applicationsOpen,
      opensAt,
      closesAt,
      isOpen,
      statusMessage,
    };
  } catch {
    return DEFAULTS;
  }
}
