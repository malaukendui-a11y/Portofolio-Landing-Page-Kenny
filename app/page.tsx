import { Hero } from '@/components/hero/Hero'
import { Certifications } from '@/components/sections/Certifications'
import { Experience } from '@/components/sections/Experience'
import { Footer } from '@/components/sections/Footer'
import { Intro } from '@/components/sections/Intro'
import { Projects } from '@/components/sections/Projects'
import { QAEvidence } from '@/components/sections/QAEvidence'
import { ReachOut } from '@/components/sections/ReachOut'
import { Services } from '@/components/sections/Services'
import { Loader } from '@/components/ui/Loader'
import { MotionRoot } from '@/components/ui/MotionRoot'
import { Nav } from '@/components/ui/Nav'
import { SkipLink } from '@/components/ui/SkipLink'

// Single route, anchored sections in PRD §5 order. MotionRoot adds the M2 motion layer.
export default function HomePage() {
  return (
    <>
      <MotionRoot />
      <SkipLink />
      <Nav />
      <main id="main" className="flex-1">
        <Hero />
        <Intro />
        <Services />
        <Projects />
        <QAEvidence />
        <Experience />
        <Certifications />
        <ReachOut />
      </main>
      <Footer />
      <Loader />
    </>
  )
}
