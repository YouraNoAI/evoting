// Bootstrap server: load config, middleware, then route modules (order matters)
import { app, PORT } from './config.js';
import './middleware.js';

// routes (these files use the global app/pool/authenticate/requireAdmin variables)
import './routes/auth.js';
import './routes/votings.js';
import './routes/admin/votings.js';
import './routes/admin/users.js';
import './routes/upload.js';
import './routes/candidate.js';

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});