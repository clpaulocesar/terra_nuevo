import { useEffect, useRef } from 'react';
import { useTemporada } from '../context/TemporadaContext.jsx';

export default function TemporadaAmbiental() {
  const {
    esHalloween,
    esNavidad,
    anioActual,
    introAbierta,
    abrirIntro,
    cerrarIntro,
  } = useTemporada();

  const introTimerRef = useRef(null);

  // Auto-cierre de intro tras 4.4s
  useEffect(() => {
    if (!introAbierta) return undefined;
    introTimerRef.current = window.setTimeout(() => {
      cerrarIntro();
    }, 4500);

    const onKey = (e) => {
      if (e.key === 'Escape') cerrarIntro();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(introTimerRef.current);
      window.removeEventListener('keydown', onKey);
    };
  }, [introAbierta, cerrarIntro]);

  if (!esHalloween && !esNavidad) {
    return null;
  }

  return (
    <>
      {/* ========================================================= */}
      {/* HALLOWEEN CANVAS & INTRO                                 */}
      {/* ========================================================= */}
      {esHalloween && (
        <>
          {/* Ambient Canvas */}
          <div className="hal-canvas" aria-hidden="true">
            <div className="hal-stars" />
            <div className="hal-ambient-fog" />

            {/* Glowing floating embers */}
            {[
              { x: '11%', y: '17%', t: '5s', delay: '-0s' },
              { x: '54%', y: '46%', t: '6s', delay: '-1s' },
              { x: '0%', y: '75%', t: '7s', delay: '-2s' },
              { x: '43%', y: '14%', t: '8s', delay: '-3s' },
              { x: '86%', y: '43%', t: '9s', delay: '-4s' },
              { x: '32%', y: '72%', t: '10s', delay: '-5s' },
              { x: '75%', y: '11%', t: '5s', delay: '-6s' },
              { x: '21%', y: '40%', t: '6s', delay: '-7s' },
              { x: '64%', y: '69%', t: '7s', delay: '-0s' },
              { x: '10%', y: '8%', t: '8s', delay: '-1s' },
              { x: '53%', y: '37%', t: '9s', delay: '-2s' },
              { x: '96%', y: '66%', t: '10s', delay: '-3s' },
              { x: '42%', y: '5%', t: '5s', delay: '-4s' },
              { x: '85%', y: '34%', t: '6s', delay: '-5s' },
              { x: '31%', y: '63%', t: '7s', delay: '-6s' },
              { x: '74%', y: '2%', t: '8s', delay: '-7s' },
              { x: '20%', y: '31%', t: '9s', delay: '-0s' },
              { x: '63%', y: '60%', t: '10s', delay: '-1s' },
              { x: '9%', y: '89%', t: '5s', delay: '-2s' },
              { x: '52%', y: '28%', t: '6s', delay: '-3s' },
              { x: '95%', y: '57%', t: '7s', delay: '-4s' },
              { x: '41%', y: '86%', t: '8s', delay: '-5s' },
              { x: '84%', y: '25%', t: '9s', delay: '-6s' },
              { x: '30%', y: '54%', t: '10s', delay: '-7s' },
              { x: '73%', y: '83%', t: '5s', delay: '-0s' },
              { x: '19%', y: '22%', t: '6s', delay: '-1s' },
              { x: '62%', y: '51%', t: '7s', delay: '-2s' },
            ].map((p, i) => (
              <i key={i} className="hal-particle" style={{ '--x': p.x, '--y': p.y, '--t': p.t, '--delay': p.delay }} />
            ))}

            {/* Flying animated bats */}
            {[
              { top: '10%', size: '21px', speed: '22s', delay: '-1s', opacity: 0.63 },
              { top: '35%', size: '15px', speed: '30s', delay: '-3s', opacity: 0.43 },
              { top: '55%', size: '26px', speed: '19s', delay: '-7s', opacity: 0.91 },
              { top: '21%', size: '17px', speed: '13s', delay: '-8s', opacity: 0.57 },
              { top: '64%', size: '25px', speed: '24s', delay: '-12s', opacity: 0.39 },
            ].map((b, i) => (
              <div
                key={i}
                className="hal-flyer"
                style={{
                  '--bat-top': b.top,
                  '--bat-size': b.size,
                  '--bat-speed': b.speed,
                  '--bat-delay': b.delay,
                  '--bat-opacity': b.opacity,
                }}
              >
                <svg viewBox="0 0 100 49" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path
                    fill="#0b0611"
                    d="M50 18c-4-8-8-11-15-13 3 8-4 12-10 10C18 10 10 13 1 20c7 5 7 10 0 14 12-1 20 3 23 9 4-7 13-10 21-5l5 9 5-9c8-5 17-2 21 5 3-6 11-10 23-9-7-4-7-9 0-14-9-7-17-10-24-5-6 2-13-2-10-10-7 2-11 5-15 13z"
                  />
                </svg>
              </div>
            ))}
          </div>

          {/* Floating Replay Button */}
          <button
            type="button"
            className="hal-float-control cursor-pointer"
            onClick={abrirIntro}
            aria-label="Repetir bienvenida de Halloween"
          >
            <span className="material-symbols-outlined text-[16px]">replay</span>
            <span>Repetir bienvenida</span>
          </button>

          {/* Cinematic Welcome Modal */}
          {introAbierta && (
            <div
              id="hal-intro"
              className="is-visible"
              role="dialog"
              aria-label="Bienvenida a Halloween en TERRA"
              aria-modal="true"
            >
              <div className="hal-intro-stars" aria-hidden="true" />
              <div className="hal-intro-moon" aria-hidden="true" />
              {/* Castle silhouette */}
              <div className="hal-intro-castle" aria-hidden="true">
                <svg viewBox="0 0 1000 270" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill="#090811"
                    d="M0 225l90-28 42 12 26-43 33 12 42-34 65 25 48-28 30 20 40-12 38 14 22-42 32 11 24-78 20 13 22-13 24 81 35-18 27 23 60-33 36 22 35-15 46 30 30-20 20 25 48-28 37 20 60-25v150H0z"
                  />
                  <path
                    fill="#100918"
                    d="M450 230V106h35V65l-15-14 34-34 31 34-14 14v41h34v124M568 230V133h35V76l-13-12 26-26 27 26-14 12v57h35v97"
                  />
                  <path fill="#e2854d" opacity="0.7" d="M495 147h13v28h-13zM607 159h14v24h-14z" />
                </svg>
              </div>

              <div className="hal-intro-content">
                <div className="hal-intro-eyebrow">Edición especial octubre {anioActual}</div>
                <h2 className="hal-intro-logo">
                  TERRA <span>HALLOWEEN</span>
                </h2>
                <p className="hal-intro-caption">
                  Esta temporada, lo extraordinario entra en tu hogar. Una experiencia de Halloween como nunca la habías visto.
                </p>
                <button type="button" className="hal-intro-cta cursor-pointer" onClick={cerrarIntro}>
                  Descubrir la experiencia &nbsp; ↗
                </button>
                <div className="hal-intro-note">La experiencia comienza automáticamente</div>
              </div>
              <div className="hal-intro-progress" aria-hidden="true" />
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* CHRISTMAS CANVAS & INTRO                                 */}
      {/* ========================================================= */}
      {esNavidad && (
        <>
          {/* Ambient Canvas */}
          <div className="xmas-canvas" aria-hidden="true">
            <div className="xmas-lights">
              {[
                { left: '1.00%', bulb: '#f5c96c', glow: '#f5c96c70', dur: '1.7s' },
                { left: '6.56%', bulb: '#cf4855', glow: '#cf485570', dur: '2.2s' },
                { left: '12.11%', bulb: '#76d0a2', glow: '#76d0a270', dur: '2.7s' },
                { left: '17.67%', bulb: '#f4d9a0', glow: '#f4d9a070', dur: '3.2s' },
                { left: '23.22%', bulb: '#a4cddb', glow: '#a4cddb70', dur: '1.7s' },
                { left: '28.78%', bulb: '#f5c96c', glow: '#f5c96c70', dur: '2.2s' },
                { left: '34.33%', bulb: '#cf4855', glow: '#cf485570', dur: '2.7s' },
                { left: '39.89%', bulb: '#76d0a2', glow: '#76d0a270', dur: '3.2s' },
                { left: '45.44%', bulb: '#f4d9a0', glow: '#f4d9a070', dur: '1.7s' },
                { left: '51.00%', bulb: '#a4cddb', glow: '#a4cddb70', dur: '2.2s' },
                { left: '56.56%', bulb: '#f5c96c', glow: '#f5c96c70', dur: '2.7s' },
                { left: '62.11%', bulb: '#cf4855', glow: '#cf485570', dur: '3.2s' },
                { left: '67.67%', bulb: '#76d0a2', glow: '#76d0a270', dur: '1.7s' },
                { left: '73.22%', bulb: '#f4d9a0', glow: '#f4d9a070', dur: '2.2s' },
                { left: '78.78%', bulb: '#a4cddb', glow: '#a4cddb70', dur: '2.7s' },
                { left: '84.33%', bulb: '#f5c96c', glow: '#f5c96c70', dur: '3.2s' },
                { left: '89.89%', bulb: '#cf4855', glow: '#cf485570', dur: '1.7s' },
                { left: '95.44%', bulb: '#76d0a2', glow: '#76d0a270', dur: '2.2s' },
              ].map((b, i) => (
                <i
                  key={i}
                  className="xmas-bulb"
                  style={{ '--left': b.left, '--bulb': b.bulb, '--glow': b.glow, '--dur': b.dur }}
                />
              ))}
            </div>

            {/* Glowing sparkle particles */}
            {[
              { x: '12%', y: '16%', t: '3.5s', delay: '0s' },
              { x: '59%', y: '39%', t: '4.5s', delay: '-1s' },
              { x: '6%', y: '62%', t: '5.5s', delay: '-2s' },
              { x: '53%', y: '85%', t: '6.5s', delay: '-3s' },
              { x: '0%', y: '14%', t: '7.5s', delay: '-4s' },
              { x: '47%', y: '37%', t: '3.5s', delay: '-5s' },
              { x: '94%', y: '60%', t: '4.5s', delay: '-6s' },
              { x: '41%', y: '83%', t: '5.5s', delay: '0s' },
              { x: '88%', y: '12%', t: '6.5s', delay: '-1s' },
              { x: '35%', y: '35%', t: '7.5s', delay: '-2s' },
              { x: '82%', y: '58%', t: '3.5s', delay: '-3s' },
              { x: '29%', y: '81%', t: '4.5s', delay: '-4s' },
              { x: '76%', y: '10%', t: '5.5s', delay: '-5s' },
              { x: '23%', y: '33%', t: '6.5s', delay: '-6s' },
              { x: '70%', y: '56%', t: '7.5s', delay: '0s' },
              { x: '17%', y: '79%', t: '3.5s', delay: '-1s' },
              { x: '64%', y: '8%', t: '4.5s', delay: '-2s' },
              { x: '11%', y: '31%', t: '5.5s', delay: '-3s' },
            ].map((p, i) => (
              <i key={i} className="xmas-particle" style={{ '--x': p.x, '--y': p.y, '--t': p.t, '--delay': p.delay }} />
            ))}
          </div>

          {/* Floating Replay Button */}
          <button
            type="button"
            className="xmas-float-control cursor-pointer"
            onClick={abrirIntro}
            aria-label="Repetir bienvenida de Navidad"
          >
            ✦ Repetir bienvenida
          </button>

          {/* Cinematic Welcome Modal */}
          {introAbierta && (
            <div
              id="xmas-intro"
              className="is-visible"
              role="dialog"
              aria-label="Bienvenida a Navidad en TERRA"
              aria-modal="true"
            >
              <div className="xmas-intro-stars" aria-hidden="true" />
              {[
                { sz: '26px', x: '9%', y: '8%', dur: '3s', delay: '-0s', ch: '✦' },
                { sz: '38px', x: '26%', y: '37%', dur: '4s', delay: '-1s', ch: '✧' },
                { sz: '50px', x: '43%', y: '66%', dur: '5s', delay: '-2s', ch: '✶' },
                { sz: '62px', x: '60%', y: '16%', dur: '6s', delay: '-3s', ch: '✦' },
                { sz: '26px', x: '77%', y: '45%', dur: '3s', delay: '-4s', ch: '✧' },
                { sz: '50px', x: '17%', y: '24%', dur: '5s', delay: '-1s', ch: '✦' },
              ].map((f, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="xmas-float-icon"
                  style={{ '--sz': f.sz, '--x': f.x, '--y': f.y, '--dur': f.dur, '--delay': f.delay }}
                >
                  {f.ch}
                </span>
              ))}

              {/* Pine forest silhouette */}
              <div className="xmas-forest" aria-hidden="true">
                <svg viewBox="0 0 1200 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M0 270l40-75-15 0 44-82-16 0 58-96 55 96-18 0 45 82-16 0 50 75zM260 275l40-67-12 0 40-74-15 0 53-94 54 94-15 0 43 74-12 0 37 67zM790 278l46-70-18 0 47-80-16 0 58-106 58 106-18 0 49 80-15 0 42 70zM1010 270l44-72-13 0 37-73-16 0 50-90 51 90-17 0 41 73-12 0 40 72z"
                    fill="#062122"
                  />
                </svg>
              </div>

              <div className="xmas-intro-content">
                <div className="xmas-intro-icon" aria-hidden="true">
                  ✦
                </div>
                <div className="xmas-intro-eyebrow">Una nueva temporada en TERRA</div>
                <h2 className="xmas-intro-logo">
                  TERRA <span>NAVIDAD</span>
                </h2>
                <p className="xmas-intro-caption">
                  La magia de compartir comienza en casa. Bienvenido a nuestra experiencia de Navidad.
                </p>
                <button type="button" className="xmas-intro-cta cursor-pointer" onClick={cerrarIntro}>
                  Entrar a TERRA &nbsp; ↗
                </button>
                <div className="xmas-intro-note">La experiencia comienza automáticamente</div>
              </div>
              <div className="xmas-intro-progress" aria-hidden="true" />
            </div>
          )}
        </>
      )}
    </>
  );
}
