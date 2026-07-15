import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ThankYou from './pages/ThankYou'
import TourDetail from './pages/TourDetail'
import Checkout from './pages/Checkout'
import GalleryPage from './pages/GalleryPage'
import TermsPage from './pages/TermsPage'
import BookPage from './pages/BookPage'
import DriverSchedulePage from './pages/DriverSchedulePage'
import ScrollToTop from './components/ScrollToTop'
import ScrollToHash from './components/ScrollToHash'
import FloatingWhatsApp from './components/FloatingWhatsApp'

function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="/driver" element={<DriverSchedulePage />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/tour/:tourId" element={<TourDetail />} />
        <Route path="/checkout/:tourId" element={<Checkout />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Routes>
      <ScrollToTop />
      <FloatingWhatsApp />
    </BrowserRouter>
  )
}

export default App
