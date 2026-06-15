import "server-only";

import { getStripeClient } from "@/lib/billing/stripe-client";
import { getContentfulConfig } from "@/lib/content/config";
import { getEntries } from "@/lib/content/contentful-client";
import { env, getPostmarkToken } from "@/lib/env";
import type {
  CMSProvider,
  EmailProvider,
  PaymentProvider,
  ProviderHealthCheck,
  VideoProvider,
} from "@/lib/integrations/contracts";
import { getPostmarkClient } from "@/lib/postmark/client";

async function okCheck(action: () => Promise<void>): Promise<ProviderHealthCheck> {
  try {
    await action();
    return { ok: true, configured: true };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      message: error instanceof Error ? error.message : "CHECK_FAILED",
    };
  }
}

export const postmarkEmailProvider: EmailProvider = {
  name: "postmark",
  async verifyConnection() {
    const token = getPostmarkToken();
    if (!token) {
      return { ok: false, configured: false, message: "POSTMARK_NOT_CONFIGURED" };
    }

    return okCheck(async () => {
      const response = await fetch("https://api.postmarkapp.com/server", {
        headers: {
          "X-Postmark-Server-Token": token,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`POSTMARK_${response.status}`);
      }

      getPostmarkClient();
    });
  },
};

export const stripePaymentProvider: PaymentProvider = {
  name: "stripe",
  async verifyConnection() {
    if (!env.STRIPE_SECRET_KEY) {
      return { ok: false, configured: false, message: "STRIPE_NOT_CONFIGURED" };
    }

    return okCheck(async () => {
      await getStripeClient().balance.retrieve();
    });
  },
};

export const dailyVideoProvider: VideoProvider = {
  name: "daily",
  async verifyConnection() {
    if (!env.DAILY_API_KEY) {
      return { ok: false, configured: false, message: "DAILY_NOT_CONFIGURED" };
    }

    const baseUrl = env.DAILY_API_BASE || "https://api.daily.co/v1";
    return okCheck(async () => {
      const response = await fetch(`${baseUrl}/rooms?limit=1`, {
        headers: {
          Authorization: `Bearer ${env.DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`DAILY_${response.status}`);
      }
    });
  },
};

export const contentfulCmsProvider: CMSProvider = {
  name: "contentful",
  async verifyConnection() {
    const config = getContentfulConfig();
    if (!config) {
      return { ok: false, configured: false, message: "CONTENTFUL_NOT_CONFIGURED" };
    }

    return okCheck(async () => {
      const response = await fetch(
        `https://cdn.contentful.com/spaces/${config.spaceId}/environments/${config.environment}`,
        {
          headers: {
            Authorization: `Bearer ${config.deliveryToken}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`CONTENTFUL_${response.status}`);
      }
    });
  },
  getEntries,
};
