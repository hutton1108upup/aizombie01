import { creditPacks } from '@/aizombie/contracts';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CreditPackPricing() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
      {creditPacks.map((pack) => (
        <Card
          key={pack.id}
          className={cn(
            'border-border/60 bg-card/50',
            pack.popular && 'border-primary'
          )}
        >
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">{pack.name}</h2>
            <p className="text-3xl font-bold text-primary">
              ${(pack.amount / 100).toFixed(2)}
            </p>
            <p>{pack.credits} credits</p>
            <p className="text-sm text-muted-foreground">
              Proposed pricing. Final video quality, expiry and refund terms
              will be confirmed before sales open.
            </p>
            <button
              type="button"
              disabled
              data-testid={`credit-pack-${pack.id}`}
              className={cn(buttonVariants(), 'w-full opacity-60')}
            >
              Checkout coming soon
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
