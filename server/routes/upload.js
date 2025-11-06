app.post('/api/admin/upload-foto', authenticate, requireAdmin, upload.single('foto'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  res.json({ message: 'Photo uploaded successfully.', url: `/uploads/${req.file.filename}` });
});

// GET list of all uploaded photos (admin only)
app.get('/api/admin/fotos', authenticate, requireAdmin, (_, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const urls = files.map(f => `/uploads/${f}`);
    res.json(urls);
  } catch (err) {
    console.error('ADMIN GET PHOTOS ERROR:', err);
    res.status(500).json({ error: 'Server error reading uploaded photos.' });
  }
});
