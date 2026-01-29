import Navbar from '../components/Navbar'
import MobileStickyNav from '../components/MobileStickyNav'
import Hero from '../components/Hero'
import About from '../components/About'
import DriversFleetTabs from '../components/DriversFleetTabs'
import Gallery from '../components/Gallery'
import WhyChooseUs from '../components/WhyChooseUs'
import ContactEnquiry from '../components/ContactEnquiry'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <MobileStickyNav />
      <Hero />
      <About />
      <DriversFleetTabs />
      <Gallery />
      <WhyChooseUs />
      <ContactEnquiry />
      <Footer />
    </>
  )
}
