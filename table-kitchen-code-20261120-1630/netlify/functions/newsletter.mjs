import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export default async function newsletter(request) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "A valid JSON request body is required." }, 400);
  }

  const email = String(body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }

  const key = createHash("sha256").update(email).digest("hex");
  try {
    const store = getStore("table-newsletter");
    await store.setJSON(
      `subscriber:${key}`,
      { email, created_at: new Date().toISOString() },
      { onlyIfNew: true },
    );
  } catch (error) {
    console.error("Could not save TABLE newsletter subscription to Netlify Blobs.", error);
    return json(
      { error: "Subscription could not be saved. Please try again." },
      500,
    );
  }

  return json({ message: "You're on the table list." }, 201);
}
