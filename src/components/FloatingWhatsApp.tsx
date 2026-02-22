
import Link from 'next/link';
import { GlobalIcon } from './icons/global-icon';

const FloatingWhatsApp = () => {
  return (
    <Link
      href="https://wa.me/523741109133" // Replace with actual number
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300 animate-in fade-in zoom-in"
    >
      <GlobalIcon src='/whatsapp.svg' alt='WhatsApp' className="h-6 w-6" />
    </Link>
  );
};

export default FloatingWhatsApp;
