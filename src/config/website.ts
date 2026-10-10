import { getMessageList } from '@/lib/locale';
import { m } from '@/locale/paraglide/messages';
import { clientEnv } from '@/env/client';
import type { WebsiteConfig } from '../types';
import {
  DEFAULT_ALLOWED_TYPES,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_USER_FILES_FOLDER,
} from '@/storage/constants';

// Payment provider controlled by env var: 'stripe' | 'creem' | 'waffo' | '' (empty means disabled)
const paymentProvider = clientEnv.VITE_PAYMENT_PROVIDER;
const isPaymentEnabled = paymentProvider !== '';
// Price/product IDs per provider; add a new row when adding a provider
const providerPriceIds = {
  stripe: {
    proMonthly: clientEnv.VITE_STRIPE_PRICE_PRO_MONTHLY,
    proYearly: clientEnv.VITE_STRIPE_PRICE_PRO_YEARLY,
    lifetime: clientEnv.VITE_STRIPE_PRICE_LIFETIME,
  },
  creem: {
    proMonthly: clientEnv.VITE_CREEM_PRODUCT_PRO_MONTHLY,
    proYearly: clientEnv.VITE_CREEM_PRODUCT_PRO_YEARLY,
    lifetime: clientEnv.VITE_CREEM_PRODUCT_LIFETIME,
  },
  waffo: {
    proMonthly: clientEnv.VITE_WAFFO_PRODUCT_PRO_MONTHLY,
    proYearly: clientEnv.VITE_WAFFO_PRODUCT_PRO_YEARLY,
    lifetime: clientEnv.VITE_WAFFO_PRODUCT_LIFETIME,
  },
} satisfies Record<
  Exclude<typeof paymentProvider, ''>,
  Record<'proMonthly' | 'proYearly' | 'lifetime', string | undefined>
>;
const activePriceIds = isPaymentEnabled
  ? providerPriceIds[paymentProvider]
  : undefined;
const priceIds = {
  proMonthly: activePriceIds?.proMonthly ?? '',
  proYearly: activePriceIds?.proYearly ?? '',
  lifetime: activePriceIds?.lifetime ?? '',
};

/**
 * Website config
 */
export const websiteConfig: WebsiteConfig = {
  ui: {
    mode: {
      defaultMode: 'dark',
      enableSwitch: true,
    },
  },
  metadata: {
    name: 'AI Zombie Video',
    title: 'AI Zombie Video Generator | Pre-launch Photo Preview',
    description:
      'Explore an AI zombie story from two photos. Preview photos locally and learn about the zombie trend format. Video generation and checkout are not open yet.',
    images: {
      ogImage: '/og.png',
      logoLight: '/logo.png',
      logoDark: '/logo-dark.png',
    },
  },
  social: {},
  auth: {
    enable:
      import.meta.env.MODE === 'e2e' || clientEnv.VITE_RELEASE_MODE === 'live',
    enableGoogleLogin: clientEnv.VITE_GOOGLE_LOGIN_ENABLED === 'true',
    enableCredentialLogin:
      import.meta.env.MODE === 'e2e' || Boolean(clientEnv.VITE_MAIL_FROM),
    enableDeleteAccount: true,
  },
  blog: {
    enable: false,
    paginationSize: 6,
  },
  mail: {
    enable: Boolean(clientEnv.VITE_MAIL_FROM),
    provider: 'cloudflare',
    fromEmail: clientEnv.VITE_MAIL_FROM ?? '',
    supportEmail: clientEnv.VITE_SUPPORT_EMAIL ?? '',
  },
  newsletter: {
    enable: false,
    provider: 'resend',
    autoSubscribeAfterSignUp: false,
  },
  notification: {
    enable: false,
    provider: 'discord',
  },
  cache: {
    enable: true,
    provider: 'kv',
  },
  storage: {
    enable: true,
    provider: 'r2',
    maxFileSize: DEFAULT_MAX_FILE_SIZE,
    allowedTypes: DEFAULT_ALLOWED_TYPES,
    userFilesFolder: DEFAULT_USER_FILES_FOLDER,
  },
  payment: {
    enable: isPaymentEnabled,
    provider: isPaymentEnabled ? paymentProvider : undefined,
    price: {
      plans: {
        free: {
          id: 'free',
          prices: [],
          isFree: true,
          isLifetime: false,
          get name() {
            return m.pricing_plans_free_name();
          },
          get description() {
            return m.pricing_plans_free_description();
          },
          get features() {
            return [...getMessageList(m.pricing_plans_free_features())];
          },
          get limits() {
            return [...getMessageList(m.pricing_plans_free_limits())];
          },
        },
        pro: {
          id: 'pro',
          prices: [
            {
              type: 'subscription',
              priceId: priceIds.proMonthly,
              amount: 990,
              currency: 'USD',
              interval: 'month',
            },
            {
              type: 'subscription',
              priceId: priceIds.proYearly,
              amount: 9900,
              currency: 'USD',
              interval: 'year',
            },
          ],
          isFree: false,
          isLifetime: false,
          popular: true,
          get name() {
            return m.pricing_plans_pro_name();
          },
          get description() {
            return m.pricing_plans_pro_description();
          },
          get features() {
            return [...getMessageList(m.pricing_plans_pro_features())];
          },
          get limits() {
            return [...getMessageList(m.pricing_plans_pro_limits())];
          },
        },
        lifetime: {
          id: 'lifetime',
          prices: [
            {
              type: 'one_time',
              priceId: priceIds.lifetime,
              amount: 19900,
              currency: 'USD',
              allowPromotionCode: true,
            },
          ],
          isFree: false,
          isLifetime: true,
          get name() {
            return m.pricing_plans_lifetime_name();
          },
          get description() {
            return m.pricing_plans_lifetime_description();
          },
          get features() {
            return [...getMessageList(m.pricing_plans_lifetime_features())];
          },
          get limits() {
            return [...getMessageList(m.pricing_plans_lifetime_limits())];
          },
        },
      },
    },
  },
};
