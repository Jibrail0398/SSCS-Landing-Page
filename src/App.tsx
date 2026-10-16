import { Fragment, useEffect, useMemo, useState, type CSSProperties } from 'react'

const EMAIL = 'contact@sscs.id'
const MAIL = `mailto:${EMAIL}?subject=${encodeURIComponent('SSCS partnership')}&body=${encodeURIComponent(
  'Hello SSCS team,\n\nWe are interested in (joint research / a pilot / a device demo).\n\nName:\nInstitution:\n',
)}`

const WA_NUMBER = '+82 10-2922-0791'
const WA = `https://wa.me/821029220791?text=${encodeURIComponent(
  'Hello SSCS team, I would like to discuss deploying the SSCS device at our healthcare facility.\n\nName:\nFacility (hospital / clinic / primary care centre / community health post):\nRegion:',
)}`

/* The lens from the "C" of the SSCS logo: two ring segments and a pupil. */
function Lens({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-152 -152 304 304" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="54">
        <path d="M0 -125 A125 125 0 0 1 95.76 -80.35" />
        <path d="M-125 0 A125 125 0 0 0 95.76 80.35" />
      </g>
      <circle r="51" fill="currentColor" />
    </svg>
  )
}

/* ---------- WHO height-for-age, approximate reference points (WHO Child Growth Standards, 2006) ---------- */
const AGES = [0, 6, 12, 18, 24, 36, 48, 60]
const WHO = {
  L: { median: [49.9, 67.6, 75.7, 82.3, 87.8, 96.1, 103.3, 110.0], sd: [1.9, 2.2, 2.4, 2.7, 3.0, 3.7, 4.2, 4.7] },
  P: { median: [49.1, 65.7, 74.0, 80.7, 86.4, 95.1, 102.7, 109.4], sd: [1.9, 2.3, 2.6, 2.9, 3.2, 3.8, 4.3, 4.7] },
}
function lerp(xs: number[], ys: number[], x: number) {
  for (let i = 0; i < xs.length - 1; i++) {
    if (x <= xs[i + 1]) {
      const t = (x - xs[i]) / (xs[i + 1] - xs[i])
      return ys[i] + t * (ys[i + 1] - ys[i])
    }
  }
  return ys[ys.length - 1]
}
function classify(z: number) {
  if (z < -3) return { key: 'severe', label: 'Severely stunted' }
  if (z < -2) return { key: 'stunted', label: 'Stunted' }
  if (z > 3) return { key: 'tall', label: 'Tall' }
  return { key: 'normal', label: 'Normal' }
}
const fmt = (n: number, d = 1) => n.toFixed(d)

/* ---------- content ---------- */
const STAGES = [
  {
    name: 'Capture',
    text: 'A photo or video of the child is taken standing or lying down. One photo is enough; video is read frame by frame.',
    img: { src: '/assets/pexels-3279207.jpg', alt: 'A health worker holds up a smiling baby while two phones take its photo' },
  },
  {
    name: 'Detect',
    text: 'RT-DETR, a transformer-based detector, locates the child’s body in the frame.',
  },
  {
    name: 'Aggregate',
    text: 'The Hierarchical Attention Aggregation module combines and weighs the information from the body detection to form a more complete estimate of stunting potential before classification.',
  },
  {
    name: 'Classify',
    text: 'The model gives each child a status (Potential Stunting or Normal), together with a confidence score for that classification.',
  },

  {
    name: 'Report',
    text: 'Results are saved per child, ready to compare with manual measurements and to pass on to a midwife or nutrition officer.',
  },
]

const STATEMENT = 'Every month, health volunteers measure Indonesia’s toddlers. SSCS helps them see sooner which children need referral'

/* ---------- reveal on entering the viewport, replay on every pass ---------- */
function useHeroScroll() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.hero')
    if (!hero || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const p = Math.min(Math.max(scrollY / hero.offsetHeight, 0), 1)
      hero.style.setProperty('--hero-p', p.toFixed(3))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    return () => {
      removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
}

function useReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        // play on every entry, reset once fully out of view so it plays again
        for (const e of entries) {
          if (e.intersectionRatio >= 0.08) e.target.classList.add('is-in')
          else if (!e.isIntersecting) e.target.classList.remove('is-in')
        }
      },
      { threshold: [0, 0.08] },
    )
    targets.forEach((el) => io.observe(el))
    const t = window.setTimeout(() => {
      targets.forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in')
      })
    }, 2500)
    return () => {
      io.disconnect()
      window.clearTimeout(t)
    }
  }, [])
}

const i = (n: number) => ({ '--i': n }) as CSSProperties

function Checker() {
  const [sex, setSex] = useState<'L' | 'P'>('P')
  const [age, setAge] = useState(24)
  const [height, setHeight] = useState(80)
  const { z, cat } = useMemo(() => {
    const median = lerp(AGES, WHO[sex].median, age)
    const sd = lerp(AGES, WHO[sex].sd, age)
    const z = (height - median) / sd
    return { z, cat: classify(z) }
  }, [sex, age, height])

  return (
    <section className="check section" id="check" aria-labelledby="check-title">
      <div className="check-stage" data-cat={cat.key} data-reveal="zoom">
        <div className="disc">
          <p className="disc-z nums" aria-live="polite">
            <span className="sr-only">z-score </span>
            {z < 0 ? '−' : '+'}
            {fmt(Math.abs(z))}
            <span className="disc-unit"> SD</span>
          </p>
          <p className="disc-label">{cat.label}</p>
        </div>
      </div>

      <div className="check-controls">
        <h2 id="check-title" className="check-title" data-reveal style={i(0)}>Check height for age</h2>
        <fieldset className="check-sex" data-reveal style={i(1)}>
          <legend className="sr-only">Sex</legend>
          {(['P', 'L'] as const).map((s) => (
            <label key={s} className="seg">
              <input type="radio" name="sex" value={s} checked={sex === s} onChange={() => setSex(s)} />
              <span>{s === 'P' ? 'Girl' : 'Boy'}</span>
            </label>
          ))}
        </fieldset>
        <label className="range" data-reveal style={i(2)}>
          <span className="range-row">
            <span>Age</span>
            <span className="nums">{age} months</span>
          </span>
          <input type="range" min={0} max={60} step={1} value={age} onChange={(e) => setAge(+e.target.value)} />
        </label>
        <label className="range" data-reveal style={i(3)}>
          <span className="range-row">
            <span>Height</span>
            <span className="nums">{fmt(height)} cm</span>
          </span>
          <input type="range" min={40} max={125} step={0.5} value={height} onChange={(e) => setHeight(+e.target.value)} />
        </label>
      </div>

      <p className="check-fact" data-reveal style={i(2)}>
        This value shows where the child’s height sits against the WHO growth standard for their age and sex. It is
        used to place the child in a height category: severely stunted, stunted, normal or tall.
      </p>
    </section>
  )
}

function Stages() {
  const [open, setOpen] = useState(0)
  return (
    <div className="stages" data-reveal="card" style={i(2)}>
      {STAGES.map((s, n) => (
        <div key={s.name} className={'stage' + (n === open ? ' is-open' : '')} data-tone={n}>
          <h3 className="stage-head">
            <button type="button" aria-expanded={n === open} aria-controls={`stage-${n}`} onClick={() => setOpen(n)}>
              {s.name}
            </button>
          </h3>
          <div className="stage-body" id={`stage-${n}`} hidden={n !== open}>
            <p>{s.text}</p>
            {s.img && (
              <figure className="stage-pic">
                <img src={s.img.src} alt={s.img.alt} width={1400} height={933} loading="lazy" decoding="async" />
              </figure>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  useReveal()
  useHeroScroll()
  return (
    <>
      <header className="bar">
        <a className="mark" href="#top" aria-label="SSCS, back to top">
          <img src="/logo-sscs.png" alt="SSCS Smart Stunting Care System" width={1600} height={386} />
        </a>
        <nav aria-label="Main">
          <ul className="nav">
            <li><a className="link" href="#how">How it works</a></li>
            <li><a className="link" href="#check">Height check</a></li>
            <li><a className="link" href="#specs">Specifications</a></li>
            <li><a className="link" href="#contact">Contact</a></li>
          </ul>
        </nav>
        <a className="button button-small" href={MAIL}>Contact us</a>
      </header>

      <main id="top">
        {/* ---------- hero ---------- */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title" className="hero-title">
              <span data-rise style={i(0)}>See stunting</span>{' '}
              <span data-rise style={i(1)}>sooner</span>
            </h1>
            <p className="hero-sub" data-rise style={i(2)}>
              SSCS reads photos and live video of young children with the HAG-RT-DETR model, screening for stunting at
              community health posts, primary care centres, clinics, hospitals and research labs.
            </p>
            <div className="hero-actions" data-rise style={i(3)}>
              <a className="button" href={MAIL}>Contact us</a>
              <a className="link link-plain" href="#check">Try the height check</a>
            </div>
          </div>
          <div className="hero-lens">
            <Lens className="lens-shape" />
            <figure className="pupil shutter is-auto">
              <img
                src="/assets/pexels-28680700.jpg"
                alt="A parent’s hands cradling a newborn baby’s feet"
                width={1400}
                height={2097}
                fetchPriority="high"
              />
            </figure>
          </div>
        </section>

        {/* ---------- intro statement ---------- */}
        <section className="intro section" aria-label="Introduction">
          <p className="statement" data-reveal="words">
            {STATEMENT.split(' ').map((w, n) => (
              <Fragment key={n}><span style={i(n)}>{w}</span>{' '}</Fragment>
            ))}
          </p>
        </section>

        {/* ---------- stats ---------- */}
        <section className="stats section" aria-labelledby="stats-title">
          <div className="tile tile-a" data-reveal="card" style={i(0)}>
            <p className="tile-figure nums" data-reveal style={i(3)}>19.8%</p>
            <p className="tile-cap" data-reveal style={i(5)}>of Indonesian children under five are stunted, according to the Indonesian Nutritional Status Survey (SSGI) 2024.</p>
          </div>
          <h2 id="stats-title" className="stats-title" data-reveal style={i(1)}>The numbers that matter</h2>
          <div className="tile tile-b" data-reveal="card" style={i(2)}>
            <p className="tile-figure nums" data-reveal style={i(5)}>−2 SD</p>
            <p className="tile-cap" data-reveal style={i(7)}>
              SD (standard deviation) measures how far a child’s height is from the median of healthy children the
              same age. Below −2 SD, a child is classed as stunted.
            </p>
          </div>
          <div className="tile tile-c" data-reveal="card" style={i(4)}>
            <p className="tile-figure nums" data-reveal style={i(7)}>1,000</p>
            <p className="tile-cap" data-reveal style={i(9)}>days, the first of a child’s life, when nutrition makes the biggest difference.</p>
          </div>
        </section>

        {/* ---------- how it works ---------- */}
        <section className="how section" id="how" aria-labelledby="how-title">
          <div className="how-intro">
            <h2 id="how-title" className="head" data-reveal style={i(0)}>From camera to decision</h2>
            <p data-reveal style={i(1)}>
              SSCS uses RT-DETR, which we modified into HAG-RT-DETR: Hierarchical Attention Aggregation. The whole
              process runs on the device, so a child’s photo never has to be sent to a server for analysis.
            </p>
          </div>
          <Stages />
        </section>

        {/* ---------- live checker ---------- */}
        <Checker />

        {/* ---------- device specification ---------- */}
        <section className="proto" id="specs" aria-labelledby="proto-title">
          <div className="proto-panel" data-reveal="card">
            <div className="proto-left">
              <h2 id="proto-title" className="proto-title" data-reveal style={i(0)}>Device specifications</h2>
              <figure className="proto-pic" data-reveal="zoom" style={i(2)}>
                <img
                  src="/assets/alat-sscs.jpg"
                  alt="SSCS prototype: a 3D-printed case labelled Smart Stunting Care, holding a GEEKOM mini PC and cables"
                  width={1280}
                  height={720}
                  loading="lazy"
                />
              </figure>
            </div>
            <div className="proto-right">
              <div className="proto-block" data-reveal style={i(1)}>
                <h3>Hardware</h3>
                <dl className="spec">
                  <div data-reveal style={i(2)}><dt>Processor</dt><dd>Intel Core i9 mini PC</dd></div>
                  <div data-reveal style={i(3)}><dt>Memory</dt><dd>32 GB RAM</dd></div>
                  <div data-reveal style={i(4)}><dt>Camera</dt><dd>For photos and live video</dd></div>
                  <div data-reveal style={i(5)}><dt>Display</dt><dd>Touchscreen monitor</dd></div>
                </dl>
              </div>
              <div className="proto-block" data-reveal style={i(2)}>
                <h3>Software</h3>
                <p data-reveal style={i(3)}>
                  All software is built in-house by the SSCS team, from the on-screen application to the AI model that
                  runs the detection.
                </p>
                <dl className="spec">
                  <div data-reveal style={i(4)}><dt>Operating system</dt><dd>Linux</dd></div>
                  <div data-reveal style={i(5)}><dt>Application</dt><dd>Built by the SSCS team</dd></div>
                  <div data-reveal style={i(6)}><dt>AI model</dt><dd>HAG-RT-DETR, trained in-house through our research</dd></div>
                </dl>
              </div>
              <a className="button" href={MAIL} data-reveal style={i(3)}>Contact us</a>
            </div>
          </div>
        </section>

        {/* ---------- call to action: the lens returns ---------- */}
        <section className="cta" id="contact" aria-labelledby="cta-title">
          <div className="cta-lens" aria-hidden="true">
            <div className="cta-lens-in" data-reveal="spin">
              <Lens className="cta-lens-shape" />
              <figure className="cta-pupil">
                <img
                  src="/assets/pexels-19357678.jpg"
                  alt=""
                  width={1400}
                  height={933}
                  loading="lazy"
                />
              </figure>
            </div>
          </div>
          <div className="cta-copy">
            <h2 id="cta-title" className="head cta-title" data-reveal style={i(0)}>Bring SSCS to your facility</h2>
            <p className="cta-sub" data-reveal style={i(1)}>
              Contact the SSCS team to deploy the device at your hospital, clinic, primary care centre or community
              health post. Tell us what your facility needs and we will plan a pilot together.
            </p>
            <ul className="cta-topics">
              <li data-reveal style={i(2)}><Lens className="cta-bullet" />A demo of the device and the HAG-RT-DETR model</li>
              <li data-reveal style={i(3)}><Lens className="cta-bullet" />Pilots at hospitals, clinics, primary care centres or health posts</li>
              <li data-reveal style={i(4)}><Lens className="cta-bullet" />Research, data and publication partnerships</li>
            </ul>
            <div className="cta-actions" data-reveal style={i(5)}>
              <a className="button cta-button" href={WA} target="_blank" rel="noopener noreferrer">
                Chat via WhatsApp
              </a>
              
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <img className="foot-mark" data-reveal style={i(0)} src="/logo-sscs.png" alt="SSCS Smart Stunting Care System" width={1600} height={386} loading="lazy" />
        <div className="foot-cols">
          <div data-reveal style={i(1)}>
            <h2>Pages</h2>
            <ul>
              <li><a className="link" href="#how">How it works</a></li>
              <li><a className="link" href="#check">Height check</a></li>
              <li><a className="link" href="#specs">Specifications</a></li>
              <li><a className="link" href="#contact">Contact</a></li>
            </ul>
          </div>
          <div data-reveal style={i(2)}>
            <h2>Contact</h2>
            <ul>
              <li><a className="link" href={WA} target="_blank" rel="noopener noreferrer">WhatsApp {WA_NUMBER}</a></li>
              <li><a className="link" href={MAIL}>{EMAIL}</a></li>
              <li>Research and business partnerships</li>
            </ul>
          </div>
          
        </div>
        <div className="foot-last" data-reveal style={i(3)}>
          <span>© 2026 SSCS · Smart Stunting Care System</span>
          <a className="button button-small" href="#top">Back to top</a>
        </div>
      </footer>
    </>
  )
}
