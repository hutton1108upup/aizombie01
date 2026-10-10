import { createFileRoute, redirect } from '@tanstack/react-router';
import { getPathWithLocale } from '@/lib/urls';
export const Route = createFileRoute('/(pages)/terms-of-service')({
  beforeLoad: () => {
    throw redirect({ href: getPathWithLocale('/terms'), statusCode: 308 });
  },
});
