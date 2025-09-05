import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { Ticket } from '../models/Ticket';

const router = Router();

// Mine (Agent sees their own)
router.get('/mine', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const tickets = await Ticket.find({ createdBy: req.user!.id })
      .populate('createdBy', 'name email role')   // <-- add this
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to load my tickets', detail: e.message });
  }
});

// All (Cadre sees all)
router.get('/', requireAuth, async (_req: AuthedRequest, res) => {
  try {
    const rows = await Ticket.find().populate('createdBy', 'name email role').sort({ createdAt: -1 });
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to load tickets', detail: e.message });
  }
});



// Normalizers
const lower = (v: unknown) => (typeof v === 'string' ? v.toLowerCase() : v);
const upper = (v: unknown) => (typeof v === 'string' ? v.toUpperCase() : v);

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  category: z.preprocess(
    lower,
    z.enum(['hardware', 'software', 'network', 'other'])
  ),
  priority: z.preprocess(
    upper,
    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('LOW')
  ),
});

router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const body = createSchema.parse(req.body);
    const t = await Ticket.create({ ...body, createdBy: req.user!.id });
    res.status(201).json(t);
  } catch (e: any) {
    // log to server and return details to client for easier debugging
    console.error('Create ticket error:', e?.issues ?? e);
    return res.status(400).json({
      message: 'Invalid payload',
      issues: e?.issues ?? e?.message ?? 'Unknown error',
      received: req.body,
    });
  }
});


// Update status (Cadre)
const statusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
});
router.patch('/:id/status', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const t = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!t) return res.status(404).json({ message: 'Not found' });
    res.json(t);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// Add note (Cadre)
const noteSchema = z.object({ text: z.string().min(1) });

router.post('/:id/notes', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { text } = noteSchema.parse(req.body);
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Not found' });
    t.notes = t.notes || [];
    // @ts-expect-error – push typed subdoc
    t.notes.push({ by: req.user!.id, text, at: new Date() });
    await t.save();
    res.json(t);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
