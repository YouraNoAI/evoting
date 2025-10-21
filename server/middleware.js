export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. User not authenticated.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
  next();
}

// expose to other modules (route files expect requireAdmin in scope)
globalThis.requireAdmin = requireAdmin;