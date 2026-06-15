export type ProviderHealthCheck = {
  ok: boolean;
  configured: boolean;
  message?: string;
};

export interface EmailProvider {
  name: "postmark";
  verifyConnection(): Promise<ProviderHealthCheck>;
}

export interface PaymentProvider {
  name: "stripe";
  verifyConnection(): Promise<ProviderHealthCheck>;
}

export interface VideoProvider {
  name: "daily";
  verifyConnection(): Promise<ProviderHealthCheck>;
}

export interface CMSProvider {
  name: "contentful";
  verifyConnection(): Promise<ProviderHealthCheck>;
  getEntries<TFields>(
    contentType: string,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<{
    items: Array<{ sys: { id: string }; fields: TFields }>;
    includes?: {
      Entry?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
      Asset?: Array<{ sys: { id: string }; fields: Record<string, unknown> }>;
    };
  } | null>;
}
