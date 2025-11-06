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

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`));
