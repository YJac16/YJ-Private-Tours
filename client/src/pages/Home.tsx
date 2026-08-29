import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import About from '../components/About'
import DriversFleetTabs from '../components/DriversFleetTabs'
import Gallery from '../components/Gallery'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <DriversFleetTabs />
      <Gallery />
      <Footer />
    </>
  )
}
