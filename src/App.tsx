import { useEffect, useMemo, useState, type CSSProperties } from 'react'

const EMAIL = 'kontak@sscs.id'
const MAIL = `mailto:${EMAIL}?subject=${encodeURIComponent('Kerja sama SSCS')}&body=${encodeURIComponent(
  'Halo tim SSCS,\n\nKami tertarik untuk (riset bersama / uji coba / demo perangkat).\n\nNama:\nInstitusi:\n',
)}`

const WA_NUMBER = '+82 10-2922-0791'
const WA = `https://wa.me/821029220791?text=${encodeURIComponent(
  'Halo tim SSCS, saya ingin mendiskusikan penerapan alat SSCS di fasilitas kesehatan kami.\n\nNama:\nFasilitas (rumah sakit / klinik / puskesmas / posyandu):\nWilayah:',
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
  if (z < -3) return { key: 'severe', label: 'Sangat pendek' }
  if (z < -2) return { key: 'stunted', label: 'Pendek' }
  if (z > 3) return { key: 'tall', label: 'Tinggi' }
  return { key: 'normal', label: 'Normal' }
}
const fmt = (n: number, d = 1) => n.toFixed(d).replace('.', ',')

/* ---------- content ---------- */
const STAGES = [
  {
    name: 'Rekam',
    text: 'Foto atau video balita diambil dalam posisi berdiri atau berbaring Satu foto cukup; video dibaca bingkai demi bingkai.',
    img: { src: '/assets/kegiatan-posyandu-desa-kanoman.jpg', alt: 'Seorang balita berdiri di atas timbangan, dikelilingi ibu dan kader posyandu' },
  },
  {
    name: 'Deteksi',
    text: 'RT-DETR, detektor berbasis transformer, melakukan deteksi pada tubuh anak',
  },
  {
    name: 'Agregasi',
    text: 'Modul Hierarchical Attention Aggregation menggabungkan dan menimbang informasi dari hasil deteksi tubuh anak untuk menghasilkan estimasi potensi stunting secara lebih menyeluruh sebelum proses klasifikasi.',
  },
  {
    name: 'Klasifikasi',
    text: 'Model memberi status per anak (Potential Stunting, Normal), disertai dengan nilai confidence dari status hasil klasifikasi pada anak',
  },

  {
    name: 'Laporan',
    text: 'Hasil disimpan per anak dan siap dibandingkan dengan pengukuran manual, lalu diteruskan ke bidan atau petugas gizi puskesmas.',
  },
]

/* ---------- reveal once on entering the viewport ---------- */
function useReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
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
    <section className="check section" id="cek" aria-labelledby="cek-title">
      <div className="check-stage" data-cat={cat.key}>
        <div className="disc">
          <p className="disc-z nums" aria-live="polite">
            <span className="sr-only">Skor z </span>
            {z < 0 ? '−' : '+'}
            {fmt(Math.abs(z))}
            <span className="disc-unit"> SD</span>
          </p>
          <p className="disc-label">{cat.label}</p>
        </div>
      </div>

      <div className="check-controls">
        <h2 id="cek-title" className="check-title">Cek tinggi menurut umur</h2>
        <fieldset className="check-sex">
          <legend className="sr-only">Jenis kelamin</legend>
          {(['P', 'L'] as const).map((s) => (
            <label key={s} className="seg">
              <input type="radio" name="sex" value={s} checked={sex === s} onChange={() => setSex(s)} />
              <span>{s === 'P' ? 'Perempuan' : 'Laki-laki'}</span>
            </label>
          ))}
        </fieldset>
        <label className="range">
          <span className="range-row">
            <span>Usia</span>
            <span className="nums">{age} bulan</span>
          </span>
          <input type="range" min={0} max={60} step={1} value={age} onChange={(e) => setAge(+e.target.value)} />
        </label>
        <label className="range">
          <span className="range-row">
            <span>Tinggi badan</span>
            <span className="nums">{fmt(height)} cm</span>
          </span>
          <input type="range" min={40} max={125} step={0.5} value={height} onChange={(e) => setHeight(+e.target.value)} />
        </label>
      </div>

      <p className="check-fact">
        Nilai ini menunjukkan posisi tinggi badan anak dibandingkan standar pertumbuhan WHO 
        berdasarkan usia dan jenis kelamin. 
        Nilai ini digunakan untuk menentukan kategori tinggi badan, seperti sangat pendek, pendek, normal, atau tinggi.
      </p>
    </section>
  )
}

function Stages() {
  const [open, setOpen] = useState(0)
  return (
    <div className="stages" data-reveal style={i(2)}>
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
                <img src={s.img.src} alt={s.img.alt} width={1400} height={931} loading="lazy" decoding="async" />
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
  return (
    <>
      <header className="bar">
        <a className="mark" href="#top" aria-label="SSCS, ke awal halaman">
          <img src="/logo-sscs.png" alt="SSCS Smart Stunting Care System" width={1600} height={386} />
        </a>
        <nav aria-label="Utama">
          <ul className="nav">
            <li><a className="link" href="#cara">Cara kerja</a></li>
            <li><a className="link" href="#cek">Cek tinggi</a></li>
            <li><a className="link" href="#spesifikasi">Spesifikasi</a></li>
            <li><a className="link" href="#kontak">Kontak</a></li>
          </ul>
        </nav>
        <a className="button button-small" href={MAIL}>Hubungi kami</a>
      </header>

      <main id="top">
        {/* ---------- hero ---------- */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title" className="hero-title">
              <span data-rise style={i(0)}>Lihat stunting</span>{' '}
              <span data-rise style={i(1)}>lebih awal</span>
            </h1>
            <p className="hero-sub" data-rise style={i(2)}>
              SSCS membaca foto dan video balita secara real-time dengan model HAG-RT-DETR, untuk skrining stunting di
              posyandu, puskesmas, klinik, rumah sakit dan laboratorium riset.
            </p>
            <div className="hero-actions" data-rise style={i(3)}>
              <a className="button" href={MAIL}>Hubungi kami</a>
              <a className="link link-plain" href="#cek">Coba cek tinggi</a>
            </div>
          </div>
          <div className="hero-lens">
            <Lens className="lens-shape" />
            <figure className="pupil shutter is-auto">
              <img
                src="/assets/posyandu.jpg"
                alt="Seorang kader posyandu memangku balita yang menatap kamera"
                width={1400}
                height={933}
                fetchPriority="high"
              />
            </figure>
          </div>
        </section>

        {/* ---------- intro statement ---------- */}
        <section className="intro section" aria-label="Pengantar">
          <p className="statement" data-reveal>
            Tiap bulan kader posyandu
            <span className="thumb"><img src="/assets/kader-posyandu.jpg" alt="" width={1400} height={933} loading="lazy" /></span>
            mengukur balita. SSCS membantu mereka melihat lebih cepat
            <span className="thumb"><img src="/assets/kegiatan-posyandu-desa-kanoman.jpg" alt="" width={1400} height={931} loading="lazy" /></span>
            anak yang perlu dirujuk
            <span className="thumb"><img src="/assets/posyandu-di-dusun-porendeang-desa-bababulo.jpg" alt="" width={1400} height={788} loading="lazy" /></span>.
          </p>
        </section>

        {/* ---------- stats ---------- */}
        <section className="stats section" aria-labelledby="stats-title">
          <div className="tile tile-a" data-reveal style={i(0)}>
            <p className="tile-figure nums">19,8%</p>
            <p className="tile-cap">balita Indonesia mengalami stunting menurut Survei Status Gizi Indonesia (SSGI) 2024.</p>
          </div>
          <h2 id="stats-title" className="stats-title" data-reveal style={i(1)}>Angka yang dikejar</h2>
          <div className="tile tile-b" data-reveal style={i(2)}>
            <p className="tile-figure nums">−2 SD</p>
            <p className="tile-cap">
              SD (standar deviasi) mengukur jarak tinggi anak dari median anak sehat seusianya. Di bawah −2 SD, anak
              tergolong pendek.
            </p>
          </div>
          <div className="tile tile-c" data-reveal style={i(3)}>
            <p className="tile-figure nums">1.000</p>
            <p className="tile-cap">hari pertama kehidupan, saat intervensi gizi paling menentukan.</p>
          </div>
        </section>

        {/* ---------- how it works ---------- */}
        <section className="how section" id="cara" aria-labelledby="cara-title">
          <div className="how-intro">
            <h2 id="cara-title" className="head" data-reveal style={i(0)}>Dari kamera ke keputusan</h2>
            <p data-reveal style={i(1)}>
              SSCS memakai RT-DETR yang kami modifikasi menjadi HAG-RT-DETR: Hierarchical Attention Aggregation. Seluruh
              proses berjalan di perangkat, jadi foto anak tidak perlu dikirim ke server untuk dianalisis.
            </p>
          </div>
          <Stages />
        </section>

        {/* ---------- live checker ---------- */}
        <Checker />

        {/* ---------- device specification ---------- */}
        <section className="proto" id="spesifikasi" aria-labelledby="proto-title">
          <div className="proto-panel">
            <div className="proto-left">
              <h2 id="proto-title" className="proto-title" data-reveal style={i(0)}>Spesifikasi alat</h2>
              <figure className="proto-pic" data-reveal style={i(2)}>
                <img
                  src="/assets/alat-sscs.jpg"
                  alt="Prototipe SSCS: kotak cetak 3D bertuliskan Smart Stunting Care berisi mini PC GEEKOM dan kabel"
                  width={1280}
                  height={720}
                  loading="lazy"
                />
              </figure>
            </div>
            <div className="proto-right">
              <div className="proto-block" data-reveal style={i(1)}>
                <h3>Spesifikasi hardware</h3>
                <dl className="spec">
                  <div><dt>Prosesor</dt><dd>Mini PC Intel Core i9</dd></div>
                  <div><dt>Memori</dt><dd>RAM 32 GB</dd></div>
                  <div><dt>Kamera</dt><dd>Untuk foto dan video langsung</dd></div>
                  <div><dt>Layar</dt><dd>Monitor layar sentuh</dd></div>
                </dl>
              </div>
              <div className="proto-block" data-reveal style={i(2)}>
                <h3>Software</h3>
                <p>
                  Seluruh perangkat lunak dikembangkan sendiri oleh tim SSCS, dari aplikasi di layar sampai model AI yang
                  menjalankan deteksi.
                </p>
                <dl className="spec">
                  <div><dt>Sistem operasi</dt><dd>Linux</dd></div>
                  <div><dt>Aplikasi</dt><dd>Dibuat sendiri oleh tim SSCS</dd></div>
                  <div><dt>Model AI</dt><dd>HAG-RT-DETR, dilatih sendiri melalui riset</dd></div>
                </dl>
              </div>
              <a className="button" href={MAIL} data-reveal style={i(3)}>Hubungi kami</a>
            </div>
          </div>
        </section>

        {/* ---------- call to action: the lens returns ---------- */}
        <section className="cta" id="kontak" aria-labelledby="cta-title">
          <div className="cta-lens" aria-hidden="true">
            <Lens className="cta-lens-shape" />
            <figure className="cta-pupil">
              <img
                src="/assets/monitoring-baby-s-weight-17580931861.jpg"
                alt=""
                width={1400}
                height={933}
                loading="lazy"
              />
            </figure>
          </div>
          <div className="cta-copy">
            <h2 id="cta-title" className="head cta-title" data-reveal style={i(0)}>SSCS untuk fasilitas kesehatan</h2>
            <p className="cta-sub" data-reveal style={i(1)}>
              Hubungi tim SSCS untuk menerapkan alat ini di rumah sakit, klinik, puskesmas, maupun posyandu. Ceritakan
              kebutuhan fasilitas Anda, kita susun rencana uji coba bersama.
            </p>
            <ul className="cta-topics" data-reveal style={i(2)}>
              <li><Lens className="cta-bullet" />Demo perangkat dan model HAG-RT-DETR</li>
              <li><Lens className="cta-bullet" />Uji coba di rumah sakit, klinik, puskesmas, atau posyandu</li>
              <li><Lens className="cta-bullet" />Kolaborasi riset, data, dan publikasi</li>
            </ul>
            <div className="cta-actions" data-reveal style={i(3)}>
              <a className="button cta-button" href={WA} target="_blank" rel="noopener noreferrer">
                Chat via WhatsApp
              </a>
              
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <img className="foot-mark" src="/logo-sscs.png" alt="SSCS Smart Stunting Care System" width={1600} height={386} loading="lazy" />
        <div className="foot-cols">
          <div>
            <h2>Halaman</h2>
            <ul>
              <li><a className="link" href="#cara">Cara kerja</a></li>
              <li><a className="link" href="#cek">Cek tinggi</a></li>
              <li><a className="link" href="#spesifikasi">Spesifikasi</a></li>
              <li><a className="link" href="#kontak">Kontak</a></li>
            </ul>
          </div>
          <div>
            <h2>Kontak</h2>
            <ul>
              <li><a className="link" href={WA} target="_blank" rel="noopener noreferrer">WhatsApp {WA_NUMBER}</a></li>
              <li><a className="link" href={MAIL}>{EMAIL}</a></li>
              <li>Riset dan kemitraan bisnis</li>
            </ul>
          </div>
          
        </div>
        <div className="foot-last">
          <span>© 2026 SSCS · Smart Stunting Care System</span>
          <a className="button button-small" href="#top">Ke atas</a>
        </div>
      </footer>
    </>
  )
}
