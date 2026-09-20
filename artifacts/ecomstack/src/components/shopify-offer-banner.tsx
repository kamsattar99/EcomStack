import { ArrowUpRight } from "lucide-react";

const SHOPIFY_AFFILIATE_URL = "https://shopify.pxf.io/the-ecom-king";

export function ShopifyOfferBanner() {
  return (
    <aside aria-label="Shopify offer" className="w-full bg-[#193C36] px-3 py-2 text-white sm:px-4">
      <div className="mx-auto flex min-h-7 max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center text-xs sm:flex-nowrap sm:text-sm">
        <span className="offer-message-long font-medium">Shopify from $1/month for 3 months</span>
        <span className="offer-message-short font-medium">Shopify from $1/month for 3 months</span>
        <a
          href={SHOPIFY_AFFILIATE_URL}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#193C36] transition-colors hover:bg-[#E8F1E6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:bg-[#d9ead8]"
        >
          Claim now — ending soon <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <span className="basis-full text-[10px] leading-4 text-[#D6E6D5] sm:basis-auto sm:text-xs">We may earn a commission.</span>
      </div>
      <style>{`
        .offer-message-short { display: none; }
        @media (max-width: 480px) {
          .offer-message-long { display: none; }
          .offer-message-short { display: inline; }
        }
      `}</style>
    </aside>
  );
}