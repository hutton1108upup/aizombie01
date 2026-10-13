import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { creditPacks } from '@/aizombie/contracts';
import {
  type CreditPackId,
  safeWaffoCheckoutUrl,
} from '@/aizombie/waffo-contracts';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/dashboard/payments')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] }),
  component: TestPayments,
});

const historySchema = z.object({
  mode: z.literal('test'),
  credits: z.number(),
  orders: z.array(
    z.object({
      id: z.string(),
      packId: z.string(),
      credits: z.number(),
      status: z.enum(['pending', 'paid', 'refunded']),
    })
  ),
});

function TestPayments() {
  const [history, setHistory] = useState<z.infer<typeof historySchema> | null>(
    null
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [request, setRequest] = useState<{
    packId: CreditPackId;
    requestId: string;
  } | null>(null);
  async function refresh() {
    try {
      const response = await fetch('/api/aizombie/payments');
      if (!response.ok)
        throw new Error(
          'Test payments are not configured. No payment is available.'
        );
      setHistory(historySchema.parse(await response.json()));
      setError('');
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Could not load payments.'
      );
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function buy(packId: CreditPackId) {
    setBusy(true);
    const input =
      request?.packId === packId
        ? request
        : { packId, requestId: crypto.randomUUID() };
    setRequest(input);
    try {
      const response = await fetch('/api/aizombie/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok)
        throw new Error(
          'Could not open test checkout. Retry or contact support.'
        );
      const result = z
        .object({ mode: z.literal('test'), url: z.url() })
        .parse(await response.json());
      window.location.assign(safeWaffoCheckoutUrl(result.url));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Checkout failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="space-y-6 p-6" data-clarity-mask="true">
      <h1 className="text-2xl font-bold">Test payments</h1>
      <p>
        Sandbox only. No real charge. Test credits cannot generate videos and do
        not count toward a production balance.
      </p>
      {error && <p role="alert">{error}</p>}
      {history && (
        <>
          <p data-testid="test-credit-balance">
            Test credits: {history.credits}
          </p>
          <div className="flex flex-wrap gap-4">
            {creditPacks.map((pack) => (
              <Button
                key={pack.id}
                disabled={busy}
                data-testid={`test-buy-${pack.id}`}
                onClick={() => void buy(pack.id)}
              >
                {pack.name}: ${(pack.amount / 100).toFixed(2)} / {pack.credits}{' '}
                test credits
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => void refresh()}
            data-testid="refresh-test-payments"
          >
            Refresh payment status
          </Button>
          <ul>
            {history.orders.map((order) => (
              <li key={order.id}>
                {order.packId}: {order.status} ({order.credits} test credits)
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
