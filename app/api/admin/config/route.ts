import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");
  return !!token && token === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("site_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { projectName, xUsername, tweetUrl, applicationsOpen, opensAt, closesAt } =
    body;

  if (!projectName || !xUsername || !tweetUrl) {
    return NextResponse.json(
      { error: "Project name, X username, and tweet URL are required." },
      { status: 400 }
    );
  }

  const cleanUsername = String(xUsername).replace(/^@/, "").trim();
  const cleanTweetUrl = String(tweetUrl).trim();

  const idMatch = cleanTweetUrl.match(/status\/(\d+)/);
  if (!idMatch) {
    return NextResponse.json(
      {
        error:
          "That doesn't look like a valid tweet link. It should look like https://x.com/handle/status/1234567890.",
      },
      { status: 400 }
    );
  }
  const tweetId = idMatch[1];

  const db = getSupabaseAdmin();
  const { error } = await db.from("site_config").upsert({
    id: 1,
    project_name: String(projectName).trim(),
    x_username: cleanUsername,
    tweet_id: tweetId,
    tweet_url: cleanTweetUrl,
    applications_open:
      applicationsOpen === undefined ? true : !!applicationsOpen,
    opens_at: opensAt || null,
    closes_at: closesAt || null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
