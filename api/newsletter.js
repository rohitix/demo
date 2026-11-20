import { db } from 'hatchable';
export const access = 'public';
export const methods = ['POST'];
export default async function (req,res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:'Enter a valid email address.'});
  await db.query('INSERT INTO table_newsletter (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',[email]);
  res.status(201).json({message:"You're on the table list."});
}