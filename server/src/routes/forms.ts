import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { rateLimit } from '../middleware';

export const forms = Router();

forms.post('/newsletter', rateLimit(5, 60_000), (req, res) => {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email().max(120) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please enter a valid email address' });
  const info = db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').run(parsed.data.email);
  res.status(info.changes ? 201 : 200).json({
    ok: true,
    message: info.changes ? 'You are on the list. Your 10% code is WELCOME10.' : 'You are already subscribed.',
  });
});

const contactBody = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(2000),
});

forms.post('/contact', rateLimit(5, 60_000), (req, res) => {
  const parsed = contactBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please fill in every field', issues: parsed.error.issues });
  const m = parsed.data;
  db.prepare('INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)').run(m.name, m.email, m.subject, m.message);
  res.status(201).json({ ok: true, message: 'Thanks, we will reply within one working day.' });
});
