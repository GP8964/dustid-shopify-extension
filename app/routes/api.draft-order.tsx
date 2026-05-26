import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

// Handle CORS preflight from storefront
export async function loader({ request }: LoaderFunctionArgs) {
  const origin = request.headers.get("Origin") || "*";
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  return json({ error: "Not found" }, 404, origin);
}

export async function action({ request }: ActionFunctionArgs) {
  const origin = request.headers.get("Origin") || "*";

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, origin);
  }

  let body: {
    shop: string;
    items: { variant_id: number; quantity: number }[];
    contact: {
      name: string;
      phone?: string;
      address?: Record<string, string>;
    };
  };

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, origin);
  }

  const { shop, items, contact } = body;

  if (!shop || !items?.length || !contact?.name) {
    return json({ error: "Missing required fields: shop, items, contact" }, 400, origin);
  }

  // Look up the offline session (access token) for this shop
  const session = await prisma.session.findFirst({
    where: { shop, isOnline: false },
    orderBy: { expires: "desc" },
  });

  if (!session?.accessToken) {
    return json({ error: "Shop not authenticated — install the app first" }, 401, origin);
  }

  // Map contact address to Shopify format (handle common field name variants)
  const addr = contact.address || {};
  const [firstName, ...nameParts] = contact.name.trim().split(" ");
  const shippingAddress = {
    first_name: firstName,
    last_name: nameParts.join(" "),
    address1: addr.street || addr.address1 || addr.line1 || "",
    address2: addr.address2 || addr.line2 || "",
    city: addr.city || "",
    province: addr.state || addr.province || "",
    zip: addr.zip || addr.postal_code || addr.postcode || "",
    country_code: addr.country_code || addr.country || "US",
    phone: contact.phone || "",
  };

  const lineItems = items.map((item) => ({
    variant_id: item.variant_id,
    quantity: item.quantity,
  }));

  const apiRes = await fetch(
    `https://${shop}/admin/api/2025-01/draft_orders.json`,
    {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": session.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        draft_order: {
          line_items: lineItems,
          shipping_address: shippingAddress,
          note: `Dustid gift — delivering to ${contact.name}`,
          tags: "dustid-gift",
        },
      }),
    },
  );

  const apiData = (await apiRes.json()) as {
    draft_order?: { invoice_url: string };
    errors?: unknown;
  };

  if (!apiRes.ok) {
    console.error("[dustid] Draft order error:", apiData.errors);
    return json({ error: "Shopify rejected the draft order", details: apiData.errors }, 502, origin);
  }

  return json({ invoice_url: apiData.draft_order!.invoice_url }, 200, origin);
}
