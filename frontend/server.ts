// server.ts — Angular 19 SSR on Node/Express

import 'zone.js/node';
import express, { NextFunction, Request, Response } from 'express';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';

// Create the Express app
const app = express();

// Create the Angular SSR engine (Node flavor)
const angularApp = new AngularNodeAppEngine();

// Optional: static assets (served by CLI in dev; useful in prod Node hosting)
// app.use(express.static('dist/frontend/browser', { index: false, maxAge: '1y' }));

// SSR middleware for all routes
app.use('*', (req: Request, res: Response, next: NextFunction) => {
  angularApp
    .handle(req) // req is a Node IncomingMessage, the engine adapts it
    .then((response) => {
      if (response) {
        // `response` is a WHATWG Response; write it to Express res
        writeResponseToNodeResponse(response, res);
      } else {
        next(); // let other middlewares handle it
      }
    })
    .catch(next);
});

// Error handler (typed to avoid TS7006)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('SSR error:', err);
  res.status(500).send('Internal Server Error');
});

/**
 * This handler is used by the Angular CLI dev-server and at build time.
 * Do not remove this export — the builder looks for it.
 */
export const reqHandler = createNodeRequestHandler(app);

// If you want to run this file directly with Node in prod, uncomment below:
// const port = Number(process.env.PORT ?? 4000);
// app.listen(port, () => console.log(`SSR server listening on http://localhost:${port}`));
