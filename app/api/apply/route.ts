import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSiteConfig } from "@/lib/config";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const STATUS_URL_RE = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
const X_HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

export async function POST(req: NextRequest) {
  const config = await getSiteConfig();
  if (!config.isOpen) {
    return NextResponse.json(
      { error: config.statusMessage || "Applications are closed." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { xUsername, wallet, followed, liked, retweeted, quoted, quotePostUrl } =
    body;

  const cleanHandle = String(xUsername || "").trim().replace(/^@/, "");
  if (!X_HANDLE_RE.test(cleanHandle)) {
    return NextResponse.json(
      { error: "Invalid X handle." },
      { status: 400 }
    );
  }
  if (!EVM_ADDRESS_RE.test(wallet || "")) {
    return NextResponse.json(
      { error: "Invalid wallet address." },
      { status: 400 }
    );
  }
  if (!followed || !liked || !retweeted || !quoted) {
    return NextResponse.json(
      { error: "All infection steps must be completed." },
      { status: 400 }
    );
  }
  if (!STATUS_URL_RE.test(quotePostUrl || "")) {
    return NextResponse.json(
      { error: "Invalid quote post link." },
      { status: 400 }
    );
  }

  const db = getSupabaseAdmin();

  // one application per X handle - upsert on x_username
  const { error } = await db.from("whitelist_applications").upsert(
    {
      x_username: cleanHandle,
      wallet_address: wallet.trim().toLowerCase(),
      followed,
      liked,
      retweeted,
      quoted,
      quote_post_url: quotePostUrl.trim(),
    },
    { onConflict: "x_username" }
  );

  if (error) {
    // unique violation on wallet_address means this wallet already applied
    // under a different X handle
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This wallet or X handle has already applied." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
