import { getStore } from "@netlify/blobs";
import { randomInt, randomUUID } from "node:crypto";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export default async function orders(request) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "A valid JSON request body is required." }, 400);
  }

  for (const key of [
    "customerName",
    "phone",
    "zone",
    "fulfillment",
    "slot",
    "paymentMethod",
    "items",
  ]) {
    if (!body?.[key]) {
      return json({ error: `${key} is required` }, 400);
    }
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return json({ error: "Your bag is empty." }, 400);
  }

  if (String(body.phone).replace(/\D/g, "").length < 10) {
    return json({ error: "Enter a valid phone number." }, 400);
  }

  const amountFields = [
    "subtotal",
    "discount",
    "deliveryFee",
    "packagingFee",
    "gst",
    "grandTotal",
  ];
  const amounts = {};
  for (const field of amountFields) {
    const amount = Number(body[field] || 0);
    if (!Number.isFinite(amount) || amount < 0) {
      return json({ error: `${field} must be a non-negative number.` }, 400);
    }
    amounts[field] = amount;
  }

  const createdAt = new Date().toISOString();
  const order = {
    order_code: `TBL-${randomInt(10000, 100000)}`,
    status: "confirmed",
    created_at: createdAt,
  };
  const record = {
    ...order,
    customer_name: String(body.customerName).slice(0, 100),
    phone: String(body.phone).slice(0, 30),
    zone: String(body.zone).slice(0, 100),
    fulfillment: String(body.fulfillment),
    slot: String(body.slot),
    payment_method: String(body.paymentMethod),
    items: body.items,
    ...amounts,
    kitchen_note: String(body.kitchenNote || "").slice(0, 500),
  };

  try {
    const store = getStore("table-orders");
    await store.setJSON(`order:${randomUUID()}`, record);
  } catch (error) {
    console.error("Could not save TABLE order to Netlify Blobs.", error);
    return json({ error: "Order could not be placed. Please try again." }, 500);
  }

  return json({ order, message: "Your order is confirmed." }, 201);
}
