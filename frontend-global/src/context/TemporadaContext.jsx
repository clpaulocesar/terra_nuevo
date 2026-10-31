import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const TemporadaContext = createContext(null);

export const CONFIG_TEMPORADAS = {
  timezone: 'America/La_Paz',
  halloween: { startMonth: 10, startDay: 1, endMonth: 10, endDay: 31 },
  navidad: { startMonth: 11, startDay: 1, endMonth: 1, endDay: 6 },
};

export function obtenerFechaBolivia() {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: CONFIG_TEMPORADAS.timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(new Date());

    const getPart = (name) => Number(parts.find((x) => x.type === name)?.value || 0);
    return {
      year: getPart('year') || new Date().getFullYear(),
      month: getPart('month') || new Date().getMonth() + 1,
      day: getPart('day') || new Date().getDate(),
    };
  } catch {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }
}

export function detectarTemporada({ month, day } = {}) {
  const fecha = month !== undefined ? { month, day } : obtenerFechaBolivia();
  if (fecha.month === 10 && fecha.day >= CONFIG_TEMPORADAS.halloween.startDay && fecha.day <= CONFIG_TEMPORADAS.halloween.endDay) {
    return 'halloween';
  }
  if (fecha.month >= 11 || (fecha.month === 1 && fecha.day <= CONFIG_TEMPORADAS.navidad.endDay)) {
    return 'navidad';
  }
  return 'halloween';
}

function leerTemporadaInicial() {
  if (typeof window === 'undefined') return 'normal';
  const param = new URLSearchParams(window.location.search).get('tema')?.toLowerCase();
  if (['halloween', 'navidad', 'normal'].includes(param)) {
    return param;
  }
  const guardado = localStorage.getItem('terra_estilo_temporada');
  if (['halloween', 'navidad', 'normal'].includes(guardado)) {
    return guardado;
  }
  // Diseño principal por defecto: 'normal'
  return 'normal';
}

export function TemporadaProvider({ children }) {
  const [temporada, setTemporada] = useState(leerTemporadaInicial);
  const [introAbierta, setIntroAbierta] = useState(false);
  const [cuentaRegresiva, setCuentaRegresiva] = useState({
    dd: '00',
    hh: '00',
    mm: '00',
    ss: '00',
    finalizado: false,
  });

  const fechaBolivia = useMemo(() => obtenerFechaBolivia(), []);
  const anioActual = fechaBolivia.year;
  const festivoActual = useMemo(() => detectarTemporada(fechaBolivia), [fechaBolivia]);

  // Actualizar clases en body y dataset en html
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.terraSeason = temporada;
    document.documentElement.classList.toggle('dark', temporada !== 'normal');
    document.body.classList.toggle('hal-active', temporada === 'halloween');
    document.body.classList.toggle('xmas-active', temporada === 'navidad');
    document.body.classList.toggle('season-standard', temporada === 'normal');

    return () => {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('hal-active', 'xmas-active', 'season-standard');
    };
  }, [temporada]);

  // Entrada cinematográfica de bienvenida
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || temporada === 'normal') {
      setIntroAbierta(false);
      return;
    }

    // Mostrar en primera visita de sesión
    const sesionClave = `terra_intro_visto_${temporada}_${anioActual}`;
    const yaVisto = sessionStorage.getItem(sesionClave) === '1';
    if (!yaVisto) {
      setIntroAbierta(true);
      sessionStorage.setItem(sesionClave, '1');
    }
  }, [temporada, anioActual]);

  const abrirIntro = useCallback(() => {
    setIntroAbierta(true);
  }, []);

  const cerrarIntro = useCallback(() => {
    setIntroAbierta(false);
  }, []);

  const cambiarTemporada = useCallback((nueva) => {
    if (!['halloween', 'navidad', 'normal'].includes(nueva)) return;
    setTemporada(nueva);
    try {
      localStorage.setItem('terra_estilo_temporada', nueva);
      const url = new URL(window.location.href);
      url.searchParams.set('tema', nueva);
      window.history.replaceState({}, '', url.toString());
    } catch {
      /* ignore */
    }
  }, []);

  const alternarDiaNoche = useCallback(() => {
    setTemporada((prev) => {
      const objetivo = prev === 'normal' ? festivoActual : 'normal';
      try {
        localStorage.setItem('terra_estilo_temporada', objetivo);
        const url = new URL(window.location.href);
        url.searchParams.set('tema', objetivo);
        window.history.replaceState({}, '', url.toString());
      } catch {
        /* ignore */
      }
      return objetivo;
    });
  }, [festivoActual]);

  // Timer de Cuenta Regresiva
  useEffect(() => {
    if (temporada === 'normal') return;

    const actualizarContador = () => {
      const { year, month } = obtenerFechaBolivia();
      let fechaObjetivoMs = 0;

      if (temporada === 'halloween') {
        fechaObjetivoMs = new Date(`${year}-10-31T00:00:00-04:00`).getTime();
      } else if (temporada === 'navidad') {
        const anioNavidad = month === 1 ? year - 1 : year;
        fechaObjetivoMs = new Date(`${anioNavidad}-12-25T00:00:00-04:00`).getTime();
      }

      const restanteMs = fechaObjetivoMs - Date.now();
      if (restanteMs <= 0) {
        setCuentaRegresiva({
          dd: '00',
          hh: '00',
          mm: '00',
          ss: '00',
          finalizado: true,
        });
        return;
      }

      const totalSeg = Math.floor(restanteMs / 1000);
      const fmt = (n) => String(n).padStart(2, '0');

      setCuentaRegresiva({
        dd: fmt(Math.floor(totalSeg / 86400)),
        hh: fmt(Math.floor((totalSeg % 86400) / 3600)),
        mm: fmt(Math.floor((totalSeg % 3600) / 60)),
        ss: fmt(totalSeg % 60),
        finalizado: false,
      });
    };

    actualizarContador();
    const interval = window.setInterval(actualizarContador, 1000);
    return () => window.clearInterval(interval);
  }, [temporada]);

  const valor = useMemo(() => ({
    temporada,
    festivoActual,
    esHalloween: temporada === 'halloween',
    esNavidad: temporada === 'navidad',
    esNormal: temporada === 'normal',
    esModoDia: temporada === 'normal',
    esModoNoche: temporada !== 'normal',
    anioActual,
    introAbierta,
    abrirIntro,
    cerrarIntro,
    cambiarTemporada,
    alternarDiaNoche,
    cuentaRegresiva,
  }), [
    temporada,
    festivoActual,
    anioActual,
    introAbierta,
    abrirIntro,
    cerrarIntro,
    cambiarTemporada,
    alternarDiaNoche,
    cuentaRegresiva,
  ]);

  return (
    <TemporadaContext.Provider value={valor}>
      {children}
    </TemporadaContext.Provider>
  );
}

export function useTemporada() {
  const ctx = useContext(TemporadaContext);
  if (!ctx) {
    throw new Error('useTemporada debe usarse dentro de un TemporadaProvider');
  }
  return ctx;
}
