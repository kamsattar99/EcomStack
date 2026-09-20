import appLogo from "@assets/ChatGPT_Image_Sep_20,_2026,_03_01_50_PM_1789913157070.png";

export function AppLogo({ className = "" }: { className?: string }) {
  return <img src={appLogo} alt="" className={`object-cover ${className}`} />;
}