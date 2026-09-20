export function ShopifyTile({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`shopify-tile relative grid place-items-center rounded-[30px] border border-white/80 bg-[#4b9d63] shadow-[inset_0_3px_5px_rgba(255,255,255,.48),inset_0_-7px_12px_rgba(16,74,39,.20),0_18px_28px_rgba(25,60,54,.20)] ${className}`}>
      <div className="absolute inset-x-3 bottom-[-9px] h-5 rounded-b-[20px] bg-[#2f7650] opacity-75 blur-[1px]" />
      <div className="absolute inset-1 rounded-[25px] border border-white/30" />
      <svg viewBox="0 0 96 110" className="relative z-10 h-[62%] w-[62%] drop-shadow-[0_4px_4px_rgba(17,67,35,.25)]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 35.5H78L73.5 98H22.5L18 35.5Z" fill="white" />
        <path d="M35 38V29C35 18.5 40.8 12 48 12C55.2 12 61 18.5 61 29V38" stroke="white" strokeWidth="8" strokeLinecap="round" />
        <path d="M56.5 50.5C53.3 48.1 49.1 46.8 44.3 47.1C37.5 47.5 34.2 51.1 34.2 55.2C34.2 59.4 38.1 61.4 44.3 63.2C50 64.9 53 66.7 53 70.3C53 74.2 49.9 76.6 45.2 76.6C40.4 76.6 36.5 74.2 34.4 72.3" stroke="#319256" strokeWidth="6" strokeLinecap="round" />
      </svg>
    </div>
  );
}