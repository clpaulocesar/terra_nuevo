import { pool } from '../config/database.js';

let tablaLista;

export function asegurarTablaVisitasBD() {
  if (!tablaLista) {
    tablaLista = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS public_page_views (
          id BIGSERIAL PRIMARY KEY,
          session_id UUID NOT NULL,
          page_path TEXT NOT NULL CHECK (page_path IN ('/', '/catalogo', '/productos', '/carrito', '/checkout')),
          visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS public_page_views_visited_at_idx
          ON public_page_views (visited_at)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS public_page_views_session_id_idx
          ON public_page_views (session_id)
      `);
    })().catch((error) => {
      tablaLista = null;
      throw error;
    });
  }
  return tablaLista;
}

export async function registrarVistaBD({ sessionId, pagePath }) {
  await asegurarTablaVisitasBD();
  await pool.query(
    'INSERT INTO public_page_views (session_id, page_path) VALUES ($1, $2)',
    [sessionId, pagePath]
  );
}

export async function obtenerAnaliticaVisitasBD({ desde, hasta }) {
  await asegurarTablaVisitasBD();

  const filtroPeriodo = `
    visited_at >= ($1::date::timestamp AT TIME ZONE 'America/La_Paz')
    AND visited_at < (($2::date + 1)::timestamp AT TIME ZONE 'America/La_Paz')
  `;
  const [resumen, porDia, paginas] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS "totalVistas",
              COUNT(DISTINCT session_id)::int AS "sesionesUnicas"
         FROM public_page_views
        WHERE ${filtroPeriodo}`,
      [desde, hasta]
    ),
    pool.query(
      `WITH dias AS (
         SELECT generate_series($1::date, $2::date, INTERVAL '1 day')::date AS fecha
       )
       SELECT to_char(dias.fecha, 'YYYY-MM-DD') AS fecha,
              COUNT(vistas.id)::int AS vistas,
              COUNT(DISTINCT vistas.session_id)::int AS sesiones
         FROM dias
         LEFT JOIN public_page_views AS vistas
           ON vistas.visited_at >= (dias.fecha::timestamp AT TIME ZONE 'America/La_Paz')
          AND vistas.visited_at < ((dias.fecha + 1)::timestamp AT TIME ZONE 'America/La_Paz')
        GROUP BY dias.fecha
        ORDER BY dias.fecha`,
      [desde, hasta]
    ),
    pool.query(
      `SELECT page_path AS pagina,
              COUNT(*)::int AS vistas,
              COUNT(DISTINCT session_id)::int AS sesiones
         FROM public_page_views
        WHERE ${filtroPeriodo}
        GROUP BY page_path
        ORDER BY vistas DESC, pagina`,
      [desde, hasta]
    ),
  ]);

  return {
    ...resumen.rows[0],
    porDia: porDia.rows,
    paginas: paginas.rows,
  };
}
