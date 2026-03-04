const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-sdk';
let googleMapsPromise: Promise<any> | null = null;

export async function loadGoogleMapsApi(apiKey?: string) {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps solo puede inicializarse en el navegador.');
  }

  if (!apiKey) {
    throw new Error('Falta configurar NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.');
  }

  if (window.google?.maps) {
    return window.google.maps;
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;

    const handleScriptLoaded = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps no estuvo disponible después de cargar el script.'));
      }
    };

    const handleScriptError = () => {
      reject(new Error('No se pudo cargar Google Maps. Verifica tu API key.'));
    };

    if (existingScript) {
      existingScript.addEventListener('load', handleScriptLoaded);
      existingScript.addEventListener('error', handleScriptError);
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', handleScriptLoaded);
    script.addEventListener('error', handleScriptError);
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
