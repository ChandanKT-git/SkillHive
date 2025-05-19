const express = require('express');
const { json } = require('express');
const { registerRoutes } = require('./routes');
const { log, setupVite, serveStatic } = require('./vite');

const app = express();

// Parse JSON request body
app.use(json());

async function startServer() {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // In development, setup Vite server for HMR
      await setupVite(app, null);
    } else {
      // In production, serve static assets
      serveStatic(app);
    }

    // Register API routes
    const server = await registerRoutes(app);

    // Global error handler
    app.use((err, _req, res, _next) => {
      log(`Error: ${err.message}`, 'error');
      res.status(err.status || 500).json({
        message: err.message || 'An unknown error occurred',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    });

    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      log(`serving on port ${PORT}`);
    });

    return server;
  } catch (error) {
    log(`Failed to start server: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Start the server if this file is executed directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer };