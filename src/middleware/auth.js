import jwt from 'jsonwebtoken';

export function signAdminToken(email) {
  return jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET, { expiresIn: process.env.ADMIN_TOKEN_TTL || '12h' });
}

export function requireAdmin(req, res, next) {
  const token = (req.get('authorization') || '').replace(/^Bearer /, '');
  try {
    if (!process.env.JWT_SECRET) throw new Error('sem segredo');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('papel inválido');
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
  }
}
