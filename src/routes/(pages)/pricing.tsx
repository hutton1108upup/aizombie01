import Container from '@/components/layout/container';
import { CreditPackPricing } from '@/components/blocks/credit-pack-pricing';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(pages)/pricing')({
  head: () =>
    seo('/pricing', {
      canonicalLocale: 'en',
      alternateLocales: ['en'],
      title: 'Planned pricing — AI Zombie Video',
      description:
        'Proposed credit packs for AI Zombie Video. Checkout is not open yet.',
    }),
  component: PricingRoute,
});
function PricingRoute() {
  return (
    <Container className="space-y-12 px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold">Planned credit packs</h1>
        <p className="mt-4 text-muted-foreground">
          Generation and checkout are not open yet. These prices are proposals,
          not purchasable offers.
        </p>
      </div>
      <CreditPackPricing />
    </Container>
  );
}
