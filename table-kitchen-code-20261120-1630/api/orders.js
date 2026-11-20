import { db } from 'hatchable';
export const access = 'public';
export const methods = ['POST'];
export default async function (req, res) {
  const b = req.body || {};
  for (const k of ['customerName','phone','zone','fulfillment','slot','paymentMethod','items']) if (!b[k]) return res.status(400).json({error:k+' is required'});
  if (!Array.isArray(b.items) || !b.items.length) return res.status(400).json({error:'Your bag is empty.'});
  if (String(b.phone).replace(/\D/g,'').length < 10) return res.status(400).json({error:'Enter a valid phone number.'});
  const n = v => Number(v || 0);
  const code = 'TBL-' + Math.floor(10000 + Math.random()*90000);
  const values = [code,String(b.customerName).slice(0,100),String(b.phone).slice(0,30),String(b.zone).slice(0,100),String(b.fulfillment),String(b.slot),String(b.paymentMethod),JSON.stringify(b.items),n(b.subtotal),n(b.discount),n(b.deliveryFee),n(b.packagingFee),n(b.gst),n(b.grandTotal),String(b.kitchenNote || '').slice(0,500)];
  const { rows } = await db.query('INSERT INTO table_orders (order_code,customer_name,phone,zone,fulfillment,slot,payment_method,items,subtotal,discount,delivery_fee,packaging_fee,gst,grand_total,kitchen_note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15) RETURNING order_code, status, created_at',values);
  res.status(201).json({order:rows[0],message:'Your order is confirmed.'});
}