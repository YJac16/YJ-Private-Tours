import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ThankYou from './pages/ThankYou'
import TourDetail from './pages/TourDetail'
import ExperienceDetail from './pages/ExperienceDetail'
import Checkout from './pages/Checkout'
import GalleryPage from './pages/GalleryPage'
import TermsPage from './pages/TermsPage'
import BookPage from './pages/BookPage'
import DriverSchedulePage from './pages/DriverSchedulePage'
import AdminPricingPage from './pages/AdminPricingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AccountPage from './pages/AccountPage'
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/driver" element={<DriverSchedulePage />} />
        <Route path="/admin/pricing" element={<AdminPricingPage />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/experience/:slug" element={<ExperienceDetail />} />
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
