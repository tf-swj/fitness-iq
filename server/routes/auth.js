const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { createUser, getUserByEmail, getUserById, updateUserProfile } = require('../db/queries');
const { signToken, requireAuth } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = createUser({ name, email, passwordHash, phone, verificationToken: null });

    // Auto-verify and sign in immediately
    const db = require('../db/schema').getDb();
    db.prepare('UPDATE users SET is_verified = 1 WHERE id = ?').run(userId);

    const user = getUserById(userId);
    const token = signToken(userId);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = getUserById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    updateUserProfile(req.userId, req.body);
    res.json(getUserById(req.userId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
