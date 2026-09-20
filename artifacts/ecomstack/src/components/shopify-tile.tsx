import shopifyIcon from "@assets/hf_20260920_140101_7d90aa47-2f29-4cf9-a78c-934d41e54227_1789913112585.png";

export function ShopifyTile({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`shopify-tile overflow-hidden rounded-[30px] shadow-[0_18px_28px_rgba(25,60,54,.20)] ${className}`}>
      <img src={shopifyIcon} alt="" className="h-full w-full object-cover" />
    </div>
  );
}