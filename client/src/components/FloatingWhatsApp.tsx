import { FaWhatsapp } from 'react-icons/fa'
import { whatsappWithMessage } from '../lib/whatsappLinks'

const BOOK_WHATSAPP_URL = whatsappWithMessage(
  "Hi, I'd like to book with KhayrCape Experiences."
)

export default function FloatingWhatsApp() {
  return (
    <a
      href={BOOK_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-4 md:right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
      aria-label="Chat on WhatsApp"
    >
      <FaWhatsapp className="text-3xl" />
    </a>
  )
}
