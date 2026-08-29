import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ThankYou from './pages/ThankYou'
import TourDetail from './pages/TourDetail'
import ExperienceDetail from './pages/ExperienceDetail'
import Checkout from './pages/Checkout'
import GalleryPage from './pages/GalleryPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import CookiesPage from './pages/CookiesPage'
import NotFoundPage from './pages/NotFoundPage'
import BookPage from './pages/BookPage'
import DriverSchedulePage from './pages/DriverSchedulePage'
import AdminPricingPage from './pages/AdminPricingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AccountPage from './pages/AccountPage'
import AccountBookingDetailPage from './pages/AccountBookingDetailPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AccountReceiptPage from './pages/AccountReceiptPage'
import ScrollToTop from './components/ScrollToTop'
import ScrollToHash from './components/ScrollToHash'
import FloatingWhatsApp from './components/FloatingWhatsApp'
import CookieBanner from './components/CookieBanner'

function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/tours" element={<Navigate to="/#tours" replace />} />
        <Route path="/contact" element={<Navigate to="/book" replace />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/bookings/:bookingId" element={<AccountBookingDetailPage />} />
        <Route
          path="/account/bookings/:bookingId/receipt"
          element={<AccountReceiptPage />}
        />
        <Route path="/driver" element={<DriverSchedulePage />} />
        <Route path="/admin/pricing" element={<AdminPricingPage />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/experience/:slug" element={<ExperienceDetail />} />
        <Route path="/tour/:tourId" element={<TourDetail />} />
        <Route path="/checkout/:tourId" element={<Checkout />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ScrollToTop />
      <FloatingWhatsApp />
      <CookieBanner />
    </BrowserRouter>
  )
}

export default App
