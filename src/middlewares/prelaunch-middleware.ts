import { createMiddleware } from '@tanstack/react-start';

// Template AI and subscription checkout must never spend money for this product.
export const prelaunchApiMiddleware = createMiddleware().server(async () => {
  return Response.json(
    { error: 'This feature is not available before launch.' },
    { status: 503 }
  );
});
