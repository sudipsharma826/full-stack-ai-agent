import { useEffect } from 'react';

const AdSense = ({ 
  slot = "8121257542",
  format = "auto",
  style = { display: "block" },
  responsive = true,
  className = ""
}) => {
  const clientId = "ca-pub-6851464724936985";

  useEffect(() => {
    // Load AdSense script if not already loaded
    if (!window.adsbygoogle) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Push ad after component mounts
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [clientId]);

  // Don't render ads in development unless specifically enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_SHOW_ADS_IN_DEV) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center ${className}`}>
        <p className="text-gray-500 text-sm">
          📱 AdSense Ad Placeholder<br />
        </p>
      </div>
    );
  }

  if (!clientId) {
    console.warn('AdSense client ID not found in environment variables');
    return null;
  }

  return (
    <div className={className}>
      <ins 
        className="adsbygoogle"
        style={style}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
};


export default AdSense;
