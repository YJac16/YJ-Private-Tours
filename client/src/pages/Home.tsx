import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import About from '../components/About'
import DriversFleetTabs from '../components/DriversFleetTabs'
import Gallery from '../components/Gallery'
import WhyChooseUs from '../components/WhyChooseUs'
import Footer from '../components/Footer'
import PageMeta from '../components/PageMeta'
import JsonLd from '../components/JsonLd'
import { HOME_META, buildLocalBusinessJsonLd } from '../seo/routes'

export default function Home() {
  return (
    <>
      <PageMeta
        title={HOME_META.title}
        description={HOME_META.description}
        path={HOME_META.path}
      />
      <JsonLd data={buildLocalBusinessJsonLd()} />
      <Navbar />
      <Hero />
      <About />
      <DriversFleetTabs />
      <Gallery />
      <WhyChooseUs />
      <Footer />
    </>
  )
}
