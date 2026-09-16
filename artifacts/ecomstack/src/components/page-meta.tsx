import { useEffect } from 'react';
import { useGetSite } from "@workspace/api-client-react";

export function PageMeta({ title, description }: { title?: string; description?: string }) {
  const { data: site } = useGetSite();
  
  useEffect(() => {
    const brand = site?.brandName || 'EcomStack';
    const finalTitle = title ? `${title} | ${brand}` : brand;
    document.title = finalTitle;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    
    const finalDesc = description || site?.tagline || "AI skills, prompts and playbooks for ecommerce.";
    metaDesc.setAttribute("content", finalDesc);
    
    // Also update OG tags for good measure
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', finalTitle);
    
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', finalDesc);

  }, [title, description, site]);
  
  return null;
}
