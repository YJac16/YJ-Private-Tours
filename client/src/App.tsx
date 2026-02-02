import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ThankYou from './pages/ThankYou'
import TourDetail from './pages/TourDetail'
import GalleryPage from './pages/GalleryPage'
import ScrollToTop from './components/ScrollToTop'
import ScrollToHash from './components/ScrollToHash'
import FloatingWhatsApp from './components/FloatingWhatsApp'

function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/tour/:tourId" element={<TourDetail />} />
        <Route path="/gallery" element={<GalleryPage />} />
      </Routes>
      <ScrollToTop />
      <FloatingWhatsApp />
    </BrowserRouter>
  )
}

export default App
