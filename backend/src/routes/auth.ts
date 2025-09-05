import { Router } from 'express';
import { z } from 'zod';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config';
import bcrypt from 'bcryptjs';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(['AGENT','CADRE']).default('AGENT')
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(409).json({ message: 'Email déjà utilisé' });

    // hash explicite (au cas où le pre('save') ne s’applique pas)
    const user = await User.create({ ...data });

    res.status(201).json({ id: user._id, email: user.email, role: user.role, name: user.name });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // IMPORTANT: charge le champ password s'il est défini select:false dans le schéma
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const ok = await bcrypt.compare(password, user.password as unknown as string);
    if (!ok) return res.status(401).json({ message: 'Identifiants invalides' });

    const payload = { id: user.id.toString(), role: user.role, email: user.email };
    const secret: Secret = config.jwtSecret;
    const options: SignOptions = { expiresIn: (config.jwtExpires as SignOptions['expiresIn']) ?? '7d' };

    const token = jwt.sign(payload, secret, options);
    const { password: _pw, ...safeUser } = user.toObject();

    return res.json({ token, user: safeUser });
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
});


export default router;
