// Offline tests for the RPDB catalogue plugin.
//
// kino.tmdb and kino.fetch are both stubbed: no test touches the network. Run it with
// `node test/plugin.test.mjs` (or `node --test test/plugin.test.mjs`).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validate } from "../sdk/validate.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = pathToFileURL(join(root, "plugin.js")).href;
const manifest = JSON.parse(readFileSync(join(root, "kino-plugin.json"), "utf8"));
// Respuestas reales de TMDB, grabadas con el kit (ver `explore/grabar-tmdb.mjs`).
const REAL = JSON.parse(readFileSync(join(root, "test", "tmdb-real.json"), "utf8"));

// plugin.js remembers per runtime whether the RPDB key was rejected, so a fresh copy keeps tests apart.
let version = 0;
function freshPlugin() {
  version += 1;
  return import(entry + "?v=" + version);
}

const KEY = "clave-de-prueba";
const RPDB = "https://api.ratingposterdb.com";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

const FILM = { id: 603, title: "Matrix", release_date: "1999-03-31", poster_path: "/matrix.jpg", backdrop_path: "/matrix-b.jpg", overview: "Neo despierta.", vote_average: 8.2, genre_ids: [28, 878] };
const NO_ART = { id: 77, title: "Sin arte", release_date: "2001-01-01" };
// A propósito en DOS listas: es el que comprueba que no se repita entre filas.
const SHARED = { id: 607, title: "Compartida", release_date: "2020-05-05", poster_path: "/shared.jpg" };
const TOP_FILM = { id: 605, title: "Mejor valorada", release_date: "2019-02-02", poster_path: "/top.jpg" };
const SOON_FILM = { id: 606, title: "Próxima", release_date: "2027-01-01", poster_path: "/soon.jpg" };
const SHOW = { id: 1399, name: "Juego de tronos", first_air_date: "2011-04-17", poster_path: "/got.jpg", vote_average: 9.2 };
const AIR_SHOW = { id: 1401, name: "Serie al aire", first_air_date: "2024-01-01", poster_path: "/air.jpg" };
const POP_SHOW = { id: 1402, name: "Serie popular", first_air_date: "2023-01-01", poster_path: "/pop.jpg" };
const TOP_SHOW = { id: 1400, name: "Serie mejor valorada", first_air_date: "2008-01-01", poster_path: "/topshow.jpg" };
const ANIME_SHOW = { id: 1500, name: "Anime de prueba", first_air_date: "2022-01-01", poster_path: "/anime.jpg" };
const DOC_FILM = { id: 700, title: "Documental de prueba", release_date: "2021-03-03", poster_path: "/doc.jpg" };
const DAY_FILM = { id: 800, title: "Tendencia de hoy", release_date: "2025-06-06", poster_path: "/day.jpg" };
const DAY_SHOW = { id: 1600, name: "Serie de hoy", first_air_date: "2025-06-06", poster_path: "/dayshow.jpg" };
const POP_FILM = { id: 801, title: "Película popular", release_date: "2024-04-04", poster_path: "/popfilm.jpg" };
// Una por género, para que las filas de la pestaña "Géneros" no se pisen entre ellas al deduplicar.
const ACTION_FILM = { id: 810, title: "Acción", release_date: "2020-01-01", poster_path: "/accion.jpg" };
const COMEDY_FILM = { id: 811, title: "Comedia", release_date: "2020-01-02", poster_path: "/comedia.jpg" };
const HORROR_FILM = { id: 812, title: "Terror", release_date: "2020-01-03", poster_path: "/terror.jpg" };
const SCIFI_FILM = { id: 813, title: "Ciencia ficción", release_date: "2020-01-04", poster_path: "/scifi.jpg" };
const ANIM_FILM = { id: 814, title: "Animación", release_date: "2020-01-05", poster_path: "/anim.jpg" };
const GENRE_FILMS = { 28: ACTION_FILM, 35: COMEDY_FILM, 27: HORROR_FILM, 878: SCIFI_FILM, 16: ANIM_FILM, 99: DOC_FILM };
const KIDS_FILM = { id: 820, title: "Infantil", release_date: "2020-02-02", poster_path: "/kids.jpg", genre_ids: [16, 10751, 35, 12, 14, 10749, 878] };
const DORAMA_SHOW = { id: 1700, name: "Dorama de prueba", first_air_date: "2023-05-05", poster_path: "/dorama.jpg", genre_ids: [18, 10766] };
const SEASON_1 = { season_number: 1, episodes: [
  { season_number: 1, episode_number: 1, name: "Se acerca el invierno", still_path: "/s1e1.jpg", air_date: "2011-04-17", runtime: 62, overview: "Ned Stark." },
  { season_number: 1, episode_number: 0, name: "Especial", air_date: "2010-01-01" },   // number 0: Kino lo descarta
] };
const SEASON_2 = { season_number: 2, episodes: [
  { season_number: 2, episode_number: 1, name: "El norte recuerda", air_date: "2012-04-01", runtime: 53 },
] };

// Cada lista trae títulos distintos, como en la vida real; SHARED sale en dos para poder comprobar que la
// segunda fila no lo repite.
const TMDB = {
  "/trending/movie/week": { results: [FILM, NO_ART, SHARED], total_pages: 3 },
  "/trending/tv/week": { results: [SHOW], total_pages: 1 },
  "/movie/top_rated": { results: [SHARED, TOP_FILM], total_pages: 1 },
  "/tv/top_rated": { results: [TOP_SHOW], total_pages: 1 },
  "/movie/now_playing": { results: [], total_pages: 1 },      // una fila sin ítems no debe aparecer
  "/movie/upcoming": { results: [SOON_FILM], total_pages: 3 },
  "/tv/on_the_air": { results: [AIR_SHOW], total_pages: 1 },
  "/tv/popular": { results: [POP_SHOW], total_pages: 1 },
  "/movie/popular": { results: [POP_FILM], total_pages: 3 },
  "/trending/movie/day": { results: [DAY_FILM], total_pages: 2 },
  "/trending/tv/day": { results: [DAY_SHOW], total_pages: 2 },
  "/discover/movie": (params) => {
    // Infantil pide DOS géneros a la vez ("16,10751" = animación Y familia).
    if (params.with_genres === "16,10751") return { results: [KIDS_FILM], total_pages: 2 };
    const film = GENRE_FILMS[Number(params.with_genres)];
    // Un género conocido trae SU película (así las filas de "Géneros" no se pisan); si no, es un mosaico
    // de categoría, que solo necesita alguna imagen para su arte.
    return film ? { results: [film], total_pages: 2 } : { results: [TOP_FILM, NO_ART], total_pages: 5 };
  },
  "/discover/tv": (params) => {
    if (params.with_original_language === "ko") return { results: [DORAMA_SHOW], total_pages: 2 };
    return Number(params.with_genres) === 16 ? { results: [ANIME_SHOW], total_pages: 4 } : { results: [TOP_SHOW], total_pages: 5 };
  },
  "/search/multi": { results: [{ ...FILM, media_type: "movie" }, { ...SHOW, media_type: "tv" }, { id: 9, name: "Gente", media_type: "person" }], total_pages: 2 },
  "/tv/1399": { id: 1399, name: "Juego de tronos", overview: "Invierno.", poster_path: "/got.jpg", seasons: [{ season_number: 0, episodes: [] }, { season_number: 1 }, { season_number: 2 }] },
  "/tv/1399/season/1": SEASON_1,
  "/tv/1399/season/2": SEASON_2,
};

/** The kino globals, as Kino gives them. Returns what the plugin asked for. */
function setKino({ config = {}, lang = "es-CO", device, fetchImpl, withTmdb = true, tmdbImpl, storage = true, store = new Map() } = {}) {
  const asked = { tmdb: [], fetch: [], store: new Map() };
  globalThis.kino = {
    lang,
    device,                       // "tv" o undefined: cualquier otra cosa es un celular
    config: { get: (name) => config[name] },
    log: () => {},
    error: (code, message, extra) => Object.assign(new Error(message || code), { code }, extra || {}),
    fetch: async (url, options) => {
      asked.fetch.push({ url: String(url), method: (options && options.method) || "GET", timeoutMs: options && options.timeoutMs });
      return fetchImpl ? fetchImpl(String(url), options) : { ok: true, status: 200, headers: {} };
    },
  };
  // El almacén del plugin: sobrevive al sandbox, así que un Map que se pasa entre sesiones lo imita.
  // `storage: false` imita a un Kino sin almacén (la API es de apiVersion 6, pero conviene que el plugin
  // no dependa de que esté).
  if (storage) {
    globalThis.kino.storage = {
      get: (k) => (store.has(k) ? store.get(k) : null),
      set: (k, v, options) => { store.set(k, v); asked.store.set(k, { value: v, ttlMs: options && options.ttlMs }); },
      remove: (k) => { store.delete(k); },
      keys: () => [...store.keys()],
    };
  }
  if (withTmdb) {
    globalThis.kino.tmdb = async (path, params) => {
      asked.tmdb.push({ path, params: params || {} });
      // `tmdbImpl` permite servir un cuerpo REAL de TMDB (test/tmdb-real.json) sin tocar el resto de
      // fixtures inventados que usan las demás pruebas.
      if (tmdbImpl) return tmdbImpl(path, params || {});
      const entry = TMDB[path];
      if (!entry) return { results: [], total_pages: 1 };
      // Un fixture puede ser una función de los parámetros: `/discover` devuelve cosas distintas según el
      // género, y sin eso las filas de Anime y Documentales no se podrían comprobar por separado.
      return typeof entry === "function" ? entry(params || {}) : entry;
    };
  }
  return asked;
}

const okFetch = () => ({ ok: true, status: 200, headers: {} });
// Un servidor que sirve pósters pero no las imágenes de pago (fondos y fotogramas): es el caso de una
// clave gratuita de RPDB, y el que vaciaba todas las tarjetas de un televisor.
const postersOnlyFetch = (url) =>
  /backdrop-default|episode-default/.test(String(url)) ? { ok: false, status: 404, headers: {} } : okFetch();
const refOf = (o) => JSON.parse(o.ref);
// Las filas se buscan por id, no por posición: el orden del Inicio cambia (las filas temáticas van
// primero para que el Home por categorías marque bien sus títulos).
const filmsRow = (rows) => rows.find((r) => r.id === "rpdb-trend-movies");
const showsRow = (rows) => rows.find((r) => r.id === "rpdb-trend-shows");
const film0 = (rows) => filmsRow(rows).items[0];
const show0 = (rows) => showsRow(rows).items[0];

test("el manifiesto es el que Kino instala", async () => {
  const r = await validate(root);
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.drops, []);
  // 9 = Kino 0.9.55, y se sube por una cosa: `labelEn`/`hintEn` (1.30.0). Por debajo de 9 se ignoran sin
  // revisarlos, así que el formulario bilingüe empieza en 9. Se mantiene lo más bajo posible por la regla
  // de la documentación —el número más bajo que tenga lo que usas, para llegar también a los Kinos viejos—
  // y por eso NO se sube a 12 (`help`, `devices`), que exigiría 0.9.74.
  assert.equal(manifest.apiVersion, 9);
  // `catalogOnly` está, y se probó a quitarlo: la 1.27.0 lo quitó y un tercer usuario reportó que Kino
  // trataba el catálogo «como si fuera de transmisión»: el botón de la ficha decía "Reproducir" y llevaba a
  // un "no reproduce nada". Un catálogo no finge ser una fuente.
  //
  // El precio, que se midió: con `catalogOnly` Kino no muestra la lupa en la cabecera de la sección. Pero la
  // búsqueda NO se pierde, y lo dice el contrato: «dentro de sus propias páginas (su sección, "Ver más", la
  // búsqueda dentro de un "Ver más") su catálogo se recorre y se busca como siempre». Eso es `scopedSearch`
  // (1.26.0), que sigue declarado. Buscar se busca en cada categoría; lo que no hay es el atajo de arriba.
  assert.equal(manifest.catalogOnly, true);
  assert.deepEqual(manifest.capabilities.sort(), ["browse", "episodes", "home", "meta", "resolve", "scopedSearch", "search"]);
  // Un solo host: TMDB va por kino.tmdb, que no necesita declararlo.
  // Los dos servidores van declarados: así la persona los elige de una lista y ninguno necesita un
  // ajuste de tipo `url` escrito a mano.
  assert.deepEqual(manifest.hosts, ["api.ratingposterdb.com", "openposterdb.com"]);
  // Kino archiva el plugin en "Utilidades" cuando no declara `categories`.
  assert.deepEqual(manifest.categories, ["movies", "series"]);
  // Y no declara `discoverable: false`, que es lo que lo dejaría fuera de «De la comunidad». La línea
  // "No aparecerá en la búsqueda de Kino" no puede salir en la validación.
  assert.equal(manifest.discoverable, undefined);
  assert.ok(!r.notes.some((n) => /No aparecerá en la búsqueda/.test(n)), "quedaría fuera de la lista: " + r.notes.join(" | "));
  // La posición por defecto del fondo: centrada a la derecha, no en una esquina.
  assert.equal(manifest.settings.find((s) => s.key === "backdropPosition").default, "r");
  // La descripción se corta a 300 caracteres: pasarse deja la frase a medias en la hoja de instalación.
  assert.ok(manifest.description.length <= 300, "description: " + manifest.description.length);
  // Los ajustes con valor y, entre ellos, cinco encabezados (`section`), una línea de estado y un botón.
  assert.deepEqual(
    manifest.settings.map((s) => s.key),
    ["servidor", "service", "key", "posterSec", "posterRatings", "posterBadgeSize", "posterTextless", "posterType",
     "backdropSec", "backdropRatings", "backdropBadgeSize", "backdropPosition", "diag", "serverStatus", "testServer",
     "comoBuscar"]
  );
  // El último encabezado explica dónde está la búsqueda, porque Kino no da lupa de cabecera a un catálogo y la
  // gente la busca ahí. Es la única forma de texto libre que tiene un formulario en apiVersion 6: el `hint` de
  // una `section`, que admite 300 caracteres (los de un campo, solo 80).
  const comoBuscar = manifest.settings.find((s) => s.key === "comoBuscar");
  assert.equal(comoBuscar.type, "section");
  assert.ok(comoBuscar.hint && comoBuscar.hint.length <= 300, "hint: " + (comoBuscar.hint || "").length);
  assert.match(comoBuscar.hint, /G\u00e9neros|Géneros/, "tiene que decir por dónde se entra");
  assert.match(comoBuscar.hint, /Buscar en esta categor/, "y el nombre del botón que se va a encontrar");
  // El póster sin texto es opcional y viene apagado: cambia el arte de TODOS los pósters.
  assert.equal(manifest.settings.find((s) => s.key === "posterTextless").type, "toggle");
  assert.equal(manifest.settings.find((s) => s.key === "posterTextless").default, false);
  // "Todas las notas" solo se ofrece en el fondo, que es ancho: en un póster ocho notas no caben.
  const posterOptions = manifest.settings.find((s) => s.key === "posterRatings").options.map((o) => o.value);
  const backdropOptions = manifest.settings.find((s) => s.key === "backdropRatings").options.map((o) => o.value);
  assert.ok(!posterOptions.includes("all"), "el póster no ofrece todas");
  assert.ok(backdropOptions.includes("all"), "el fondo sí");
  assert.deepEqual(
    manifest.settings.filter((s) => ["section", "status", "action"].includes(s.type)).map((s) => s.type),
    ["section", "section", "section", "section", "status", "action", "section"]
  );
  assert.equal(manifest.settings[1].type, "select");
  // La clave va como TEXTO, no como contraseña: es una clave pública y gratuita la que viene puesta, y
  // declararla `password` hacía que la hoja de consentimiento dijera "Este plugin usa tu usuario y
  // contraseña" — lo primero que lee quien va a instalar, y falso para el 99 % de los casos.
  assert.equal(manifest.settings[2].type, "text");
  assert.equal(manifest.settings[2].default, "t0-free-rpdb");   // arranca funcionando sin escribir nada
  // Su propia sección: en la tele es una entrada del menú y en el celular un chip de Inicio.
  assert.equal(manifest.section.label, "PosterX");
  assert.equal(manifest.name, "PosterX");
  assert.equal(manifest.settings[2].required, undefined);
  // Sin `settingsLayout`: el formulario es la lista de siempre. Se probaron las tarjetas y en una tele se
  // veían recargadas, así que no se declara el campo.
  assert.equal(manifest.settingsLayout, undefined);
  // Y las pistas se recortaron a las que aportan algo: cada línea de gris es peso visual. Son seis: las
  // cinco de los campos que no se entienden solos, más la de "Cómo buscar" al final — la única forma de
  // contarle a la persona dónde está la búsqueda, porque Kino no le da lupa de cabecera a un catálogo.
  const conPista = manifest.settings.filter((s) => s.hint);
  assert.ok(conPista.length <= 6, "pistas: " + conPista.length);
  for (const s of conPista) {
    // Una `section` admite 300; un campo, 80. Pasarse del tope deja el texto cortado a media frase.
    const tope = s.type === "section" ? 300 : 80;
    assert.ok(s.hint.length <= tope, s.key + ": " + s.hint.length + " > " + tope);
  }
  // Y el formulario va en los dos idiomas: el plugin ya hablaba inglés en sus textos propios (TEXT.en),
  // pero los ajustes eran solo español, así que con Kino en inglés salía una mezcla.
  for (const s of manifest.settings) {
    assert.ok(s.labelEn, "sin labelEn: " + s.key);
    assert.ok(s.labelEn.length <= 40, "labelEn largo: " + s.key);
    if (s.hint) {
      assert.ok(s.hintEn, "pista sin hintEn: " + s.key);
      assert.ok(s.hintEn.length <= (s.type === "section" ? 300 : 80), "hintEn largo: " + s.key);
    }
  }
});

test("home() arma las filas de TMDB y cada ítem lleva su póster con nota", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY, service: "rpdb" }, fetchImpl: okFetch });
  const rows = await plugin.home();

  // La fila "En cines" viene vacía en el fixture, así que no debe aparecer.
  // Las temáticas van primero a propósito: en el Home por categorías, el tipo de un título lo decide la
  // primera fila en que aparece, así que un anime que también es tendencia debe salir antes por Anime.
  assert.deepEqual(rows.map((r) => r.id), ["rpdb-anime", "rpdb-docs", "rpdb-kids", "rpdb-doramas", "rpdb-trend-movies", "rpdb-trend-shows", "rpdb-top-movies", "rpdb-top-shows", "rpdb-on-air", "rpdb-upcoming"]);
  assert.equal(filmsRow(rows).title, "Películas en tendencia");
  assert.equal(filmsRow(rows).genre, "peliculas");
  assert.ok(filmsRow(rows).ref, "una fila con ref y browse() tiene la tarjeta Ver más");

  const film = film0(rows);
  assert.equal(film.id, "mv-603");
  assert.equal(film.kind, "movie");
  assert.equal(film.year, "1999");
  assert.deepEqual(film.ids, { tmdb: 603 });
  assert.equal(film.poster, RPDB + "/" + KEY + "/tmdb/poster-default/movie-603.jpg?fallback=true");
  // Con un servidor que sí sirve fondos con nota (la sonda pasó), el fondo también es suyo.
  assert.equal(film.backdrop, RPDB + "/" + KEY + "/tmdb/backdrop-default/movie-603.jpg?fallback=true");

  // TMDB puede no traer ruta de imagen (su respaldo de idioma no siempre ocurre). Con clave, a RPDB se
  // le pide el póster igual, porque resuelve el arte por su cuenta; ese era el hueco que dejaba tarjetas
  // en blanco.
  assert.equal(filmsRow(rows).items[1].poster, RPDB + "/" + KEY + "/tmdb/poster-default/movie-77.jpg?fallback=true");
  assert.deepEqual(asked.tmdb.map((c) => c.path).sort(), ["/discover/movie", "/discover/movie", "/discover/tv", "/discover/tv", "/movie/now_playing", "/movie/top_rated", "/movie/upcoming", "/trending/movie/week", "/trending/tv/week", "/tv/on_the_air", "/tv/top_rated"]);
  assert.equal(asked.tmdb[0].params.language, "es-MX");
});

test("Anime y Documentales se piden con su género, y su Ver más lo conserva", async () => {
  // Animation a secas traería también dibujos occidentales: el idioma original es lo que hace que Anime
  // sea anime. Y el "Ver más" de la fila tiene que seguir pidiendo lo mismo, no la lista sin filtrar.
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY, service: "rpdb" }, device: "tv", fetchImpl: okFetch });
  const rows = await plugin.home();
  const anime = rows.find((r) => r.id === "rpdb-anime");
  const docs = rows.find((r) => r.id === "rpdb-docs");
  assert.equal(anime.title, "Anime");
  assert.equal(docs.title, "Documentales");
  assert.deepEqual(refOf(anime).params, { with_genres: 16, with_original_language: "ja", sort_by: "popularity.desc" });
  assert.deepEqual(refOf(docs).params, { with_genres: 99, sort_by: "popularity.desc" });

  const call = asked.tmdb.find((c) => c.path === "/discover/tv" && c.params.with_genres === 16);
  assert.equal(call.params.with_original_language, "ja");

  // Y el "Ver más" pagina esa misma lista.
  const more = await plugin.browse(anime.ref, null);
  assert.equal(more.items[0].id, "tv-1500");
  assert.equal(more.next, "2");
  const last = asked.tmdb[asked.tmdb.length - 1];
  assert.equal(last.params.with_genres, 16);
  assert.equal(last.params.with_original_language, "ja");
  assert.equal(last.params.page, 1);
});

test("el id de TMDB lleva el tipo de medio, para que RPDB no tenga que adivinar", async () => {
  const plugin = await freshPlugin();
  setKino({ config: { key: KEY }, fetchImpl: okFetch });
  const rows = await plugin.home();
  const film = film0(rows);
  const show = show0(rows);
  // El mismo número existe como película y como serie: sin el prefijo, RPDB adivina por popularidad,
  // y el título que pierde recibe el póster de otro o ninguno. Ese era el fallo de las series.
  assert.match(film.poster, /\/tmdb\/poster-default\/movie-\d+\.jpg/);
  assert.match(show.poster, /\/tmdb\/poster-default\/series-\d+\.jpg/);
});

test("si el servidor no sirve fondos con nota, los fondos van por TMDB", async () => {
  // Este fue el fallo de la tele: los fondos con nota son un plan de pago, así que pedirlos con una
  // clave que no los incluye dejaba vacías TODAS las tarjetas, porque en un televisor Kino dibuja las
  // tarjetas con el fondo. La sonda lo detecta y los fondos caen a TMDB, que es gratis y siempre está.
  const plugin = await freshPlugin();
  setKino({ config: { key: KEY, service: "rpdb" }, fetchImpl: postersOnlyFetch });
  const rows = await plugin.home();
  for (const row of rows) {
    for (const it of row.items) {
      if (it.backdrop) assert.match(it.backdrop, /^https:\/\/image\.tmdb\.org\//, it.title);
    }
  }
  // La película del fixture trae fondo y la serie no: la serie se queda sin fondo, no con uno roto.
  assert.equal(film0(rows).backdrop, "https://image.tmdb.org/t/p/w780/matrix-b.jpg");
  assert.equal(show0(rows).backdrop, undefined);
  // Y el póster sí lleva su nota: el fallo del fondo no arrastra al póster.
  assert.match(film0(rows).poster, /^https:\/\/api\.ratingposterdb\.com\//);
  // La sonda del fondo se hace UNA vez por sesión, no por título.
  await plugin.home();
});

const THREE = "ratings_order=imdb,rt,mc&ratings_limit=3&ratings_exclude=mal,lb,rta,tmdb,trakt,mdblist,ebert";
// El idioma va SIEMPRE en el póster (medido: sin él el servidor sirve inglés); en el fondo no cambia nada.
const LANG = "lang=es-MX&";
const FINE_POSTER = "?" + LANG + "position=bc&badge_size=m&" + THREE + "&fallback=true";
const FINE_BACKDROP = "?position=r&badge_size=l&" + THREE + "&fallback=true";

test("un servidor propio cambia la base y, EN LA TELE, aplica el ajuste fino", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY, service: "openposterdb" }, device: "tv", fetchImpl: okFetch });
  const rows = await plugin.home();
  assert.equal(film0(rows).poster, "https://openposterdb.com/" + KEY + "/tmdb/poster-default/movie-603.jpg" + FINE_POSTER);
  assert.equal(film0(rows).backdrop, "https://openposterdb.com/" + KEY + "/tmdb/backdrop-default/movie-603.jpg" + FINE_BACKDROP);
  // La sonda de la clave va al servidor configurado y SIN el ajuste: así un parámetro rechazado no se
  // puede confundir con una clave mala.
  assert.equal(asked.fetch[0].url, "https://openposterdb.com/" + KEY + "/imdb/poster-default/tt0133093.jpg?fallback=true");

  // Una barra final de más no puede producir una barra doble.
  const slash = await freshPlugin();
  setKino({ config: { key: KEY, service: "openposterdb" }, device: "tv", fetchImpl: okFetch });
  assert.equal(film0(await slash.home()).poster, film0(rows).poster);
});

test("en el celular no se aplica el ajuste de la tele, pero sí el idioma y la posición", async () => {
  // Los ajustes viajan con la cuenta, así que lo que se elija para la tele (el tamaño de la nota y qué
  // notas) no puede cambiar el celular. El idioma, el "póster sin el título" y la POSICIÓN sí van en los
  // dos: no dependen de la forma de la tarjeta, y en el celular se veían pósters en inglés y las notas
  // pegadas a la esquina de la pantalla.
  const plugin = await freshPlugin();
  setKino({ config: { key: KEY, service: "openposterdb" }, fetchImpl: okFetch });   // sin device
  const rows = await plugin.home();
  assert.equal(film0(rows).poster, "https://openposterdb.com/" + KEY + "/tmdb/poster-default/movie-603.jpg?lang=es-MX&position=bc&fallback=true");
  assert.ok(!film0(rows).poster.includes("badge_size"));
  assert.ok(!film0(rows).poster.includes("ratings_"));

  // Y un device que no sea "tv" también es un celular.
  const other = await freshPlugin();
  setKino({ config: { key: KEY, service: "openposterdb" }, device: "phone", fetchImpl: okFetch });
  const phone = film0(await other.home());
  assert.ok(!phone.poster.includes("badge_size"));
  assert.ok(phone.poster.includes("lang=es-MX"), "el idioma sí viaja al celular");
  assert.ok(!phone.backdrop.includes("lang="), "el idioma solo va en el póster: en el fondo no cambia nada");
  assert.ok(phone.backdrop.includes("position=r"), "el fondo va centrado a la derecha, no en la esquina");
});

test("el ajuste fino responde a sus opciones", async () => {
  const onTv = (extra) => ({ key: KEY, service: "openposterdb", ...extra });

  // "Automático" deja que el servidor elija, pero con tope de tres para que quepan en una fila.
  let plugin = await freshPlugin();
  setKino({ config: onTv({ posterRatings: "auto", posterBadgeSize: "normal" }), device: "tv", fetchImpl: okFetch });
  let url = film0(await plugin.home()).poster;
  assert.match(url, /\?lang=es-MX&position=bc&badge_size=m&ratings_limit=3&fallback=true$/);
  assert.ok(!url.includes("ratings_order"), "automático no impone orden");
  assert.ok(!url.includes("ratings_exclude"), "automático no excluye nada");

  // "IMDb y RT (+ MAL en anime)": MyAnimeList va primero a propósito — solo puntúa anime, así que en una
  // película no existe y el servidor pasa a IMDb — y Letterboxd queda fuera, que puntúa sobre 5.
  plugin = await freshPlugin();
  setKino({ config: onTv({ posterRatings: "imdbRtMal" }), device: "tv", fetchImpl: okFetch });
  url = film0(await plugin.home()).poster;
  assert.match(url, /ratings_order=mal,imdb,rt,mc&ratings_limit=3&ratings_exclude=lb,rta,tmdb,trakt,mdblist,ebert/);

  // "IMDb y si no hay, TMDB": una nota, y solo de esas dos fuentes.
  plugin = await freshPlugin();
  setKino({ config: onTv({ posterRatings: "imdbFallback" }), device: "tv", fetchImpl: okFetch });
  url = film0(await plugin.home()).poster;
  assert.match(url, /ratings_order=imdb,tmdb&ratings_limit=1&ratings_exclude=mal,lb,rt,mc,rta,trakt,mdblist,ebert/);

  // "IMDb y Rotten Tomatoes": dos notas, y ni Letterboxd ni Metacritic ni las demás.
  plugin = await freshPlugin();
  setKino({ config: onTv({ posterRatings: "imdbRt" }), device: "tv", fetchImpl: okFetch });
  url = film0(await plugin.home()).poster;
  assert.match(url, /position=bc&badge_size=l&ratings_order=imdb,rt&ratings_limit=2&ratings_exclude=mal,lb,mc,rta,tmdb,trakt,mdblist,ebert/);

  // "Solo IMDb" se queda en una nota, con todo lo demás fuera.
  plugin = await freshPlugin();
  setKino({ config: onTv({ posterRatings: "imdb" }), device: "tv", fetchImpl: okFetch });
  url = film0(await plugin.home()).poster;
  assert.match(url, /position=bc&badge_size=l&ratings_order=imdb&ratings_limit=1&ratings_exclude=mal,lb,rt,mc,rta,tmdb,trakt,mdblist,ebert/);

  // "IMDb, RT y Metacritic": tres notas, y el tamaño baja a mediano porque a "l" se partían en dos
  // líneas y tapaban el título del póster.
  plugin = await freshPlugin();
  setKino({ config: onTv({ posterRatings: "imdbRtMc" }), device: "tv", fetchImpl: okFetch });
  const rows = await plugin.home();
  assert.match(film0(rows).poster, /position=bc&badge_size=m&ratings_order=imdb,rt,mc&ratings_limit=3&ratings_exclude=mal,lb,rta,tmdb,trakt,mdblist,ebert/);

  // "Muy grandes" sube la nota; `imageSize` es cosa del fondo (una imagen ancha), no del póster.
  plugin = await freshPlugin();
  setKino({ config: onTv({ posterBadgeSize: "max", posterRatings: "imdb" }), device: "tv", fetchImpl: okFetch });
  url = film0(await plugin.home()).poster;
  assert.match(url, /position=bc&badge_size=xl&ratings_order=imdb/);
  assert.ok(!url.includes("imageSize"), "un póster no lleva imageSize");

  // Y un valor raro cae al de fábrica en vez de romper la dirección.
  plugin = await freshPlugin();
  setKino({ config: onTv({ posterBadgeSize: "lo-que-sea", posterRatings: "lo-que-sea" }), device: "tv", fetchImpl: okFetch });
  assert.match(film0(await plugin.home()).poster, /\?lang=es-MX&position=bc&badge_size=m&ratings_order=imdb,rt,mc&ratings_limit=3&ratings_exclude=/);
});

test("si el servidor rechaza el ajuste fino, se cae a las notas por defecto", async () => {
  // La lista de claves de ratings_exclude es del servidor: una clave que no conozca hace que responda 400
  // y la imagen se pierde entera. Por eso el ajuste se prueba antes, y si falla se suelta.
  const plugin = await freshPlugin();
  const asked = setKino({
    config: { key: KEY, service: "openposterdb" },
    device: "tv",
    fetchImpl: (url) => (/ratings_exclude|badge_size/.test(String(url)) ? { ok: false, status: 400, headers: {} } : okFetch()),
  });
  const rows = await plugin.home();
  // Las imágenes siguen saliendo, sin el ajuste de la tele pero del servidor (no caen a TMDB). El idioma
  // se queda: no forma parte del ajuste que se probó, y quitarlo devolvería los pósters en inglés.
  assert.equal(film0(rows).poster, "https://openposterdb.com/" + KEY + "/tmdb/poster-default/movie-603.jpg?lang=es-MX&position=bc&fallback=true");
  // Y el ajuste se probó una sola vez.
  assert.equal(asked.fetch.filter((c) => c.url.includes("badge_size")).length, 1);
});

test("con RatingPosterDB la dirección NO lleva el ajuste fino", async () => {
  // Los parámetros son del servidor gratuito. Con RPDB la dirección se queda exactamente como la que
  // funciona: un parámetro desconocido no puede tumbar todas las imágenes.
  const plugin = await freshPlugin();
  setKino({ config: { key: KEY, service: "rpdb" }, device: "tv", fetchImpl: okFetch });
  const rows = await plugin.home();
  assert.equal(film0(rows).poster, RPDB + "/" + KEY + "/tmdb/poster-default/movie-603.jpg?fallback=true");
  assert.equal(film0(rows).backdrop, RPDB + "/" + KEY + "/tmdb/backdrop-default/movie-603.jpg?fallback=true");
  assert.ok(!film0(rows).poster.includes("badge_size"));
});

test("sin clave de RPDB el catálogo funciona igual, con los pósters de TMDB", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: {}, fetchImpl: okFetch });
  const rows = await plugin.home();
  assert.equal(film0(rows).poster, TMDB_IMG + "/matrix.jpg");
  // Y sin clave no hay a quién preguntar: un título sin ruta de imagen se queda sin póster.
  assert.equal(filmsRow(rows).items[1].poster, undefined);
  assert.deepEqual(asked.fetch, [], "sin clave no hay nada que comprobar");
});

test("una clave rechazada cae a los pósters de TMDB, sin imágenes rotas y con una sola sonda", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: "mala" }, fetchImpl: () => ({ ok: false, status: 403, headers: {} }) });
  const rows = await plugin.home();
  assert.equal(film0(rows).poster, TMDB_IMG + "/matrix.jpg");
  assert.equal(asked.fetch.length, 1);
  assert.equal(asked.fetch[0].method, "HEAD");
  assert.match(asked.fetch[0].url, /tt0133093/);

  // Y la segunda llamada ya no vuelve a probar.
  await plugin.search({ q: "matrix" });
  assert.equal(asked.fetch.length, 1);
});

test("search() filtra a películas y series, y pagina", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY }, fetchImpl: okFetch });
  const page = await plugin.search({ q: "cualquiera", cursor: null });
  assert.deepEqual(page.items.map((i) => i.kind), ["movie", "series"]);   // la persona del resultado se cae
  assert.equal(page.next, "2");                                          // total_pages 2
  assert.equal(asked.tmdb[0].params.query, "cualquiera");
  assert.equal(asked.tmdb[0].params.include_adult, false);

  const last = await plugin.search({ q: "cualquiera", cursor: "2" });
  assert.equal(last.next, undefined);

  setKino({ config: { key: KEY }, fetchImpl: okFetch });
  assert.deepEqual(await plugin.search({ q: "   " }), []);                // sin consulta no se llama a TMDB
});

test("browse() pagina una fila y se detiene al final", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY }, fetchImpl: okFetch });
  const ref = JSON.stringify({ path: "/trending/movie/week", kind: "movie" });

  const first = await plugin.browse(ref, null);
  assert.equal(first.next, "2");
  assert.equal(asked.tmdb[0].params.page, 1);

  const last = await plugin.browse(ref, "3");     // total_pages: 3
  assert.equal(last.next, undefined);
  assert.equal(asked.tmdb[1].params.page, 3);
});

test("un ref hostil no llega a TMDB", async () => {
  const plugin = await freshPlugin();
  for (const bad of ['{"path":"/../../otro","kind":"movie"}', '{"path":"https://otro.example/x","kind":"movie"}', '{"path":"/movie/603","kind":"otro"}', "no es json", "{}", ""]) {
    const asked = setKino({ config: { key: KEY }, fetchImpl: okFetch });
    const page = await plugin.browse(bad, null);
    assert.deepEqual(page.items, [], bad);
    assert.deepEqual(asked.tmdb, [], bad);
    assert.deepEqual((await plugin.episodes(bad)).episodes, [], bad);
  }
});

test("episodes() arma los capítulos y descarta los especiales", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY, service: "rpdb" }, fetchImpl: okFetch });
  const out = await plugin.episodes(JSON.stringify({ kind: "tv", id: 1399, list: true }));
  assert.equal(out.series.title, "Juego de tronos");
  assert.equal(out.series.poster, RPDB + "/" + KEY + "/tmdb/poster-default/series-1399.jpg?fallback=true");
  assert.deepEqual(out.episodes.map((e) => [e.season, e.number]), [[1, 1], [2, 1]]);
  const first = out.episodes[0];
  assert.equal(first.title, "Se acerca el invierno");
  assert.equal(first.airDate, "2011-04-17");
  assert.equal(first.runtimeMinutes, 62);
  // El servidor sirve fotogramas con nota (la sonda pasó), así que el capítulo usa el suyo.
  assert.equal(first.still, RPDB + "/" + KEY + "/tmdb/episode-default/episode-1399-S1E1.jpg?fallback=true");
  assert.deepEqual(refOf(first), { kind: "tv", id: 1399, s: 1, e: 1 });
  // La temporada 0 (especiales) no se pide; las demás sí.
  assert.deepEqual(asked.tmdb.map((c) => c.path), ["/tv/1399", "/tv/1399/season/1", "/tv/1399/season/2"]);

  // El ref que item() entrega de verdad (con path) da lo mismo: episodes() solo necesita kind e id.
  const viaItemRef = await plugin.episodes(JSON.stringify({ path: "/tv/1399", kind: "tv", id: 1399, list: true }));
  assert.deepEqual(viaItemRef.episodes.map((e) => [e.season, e.number]), [[1, 1], [2, 1]]);
  // Y el ref de una película no lista capítulos.
  assert.deepEqual((await plugin.episodes(JSON.stringify({ path: "/movie/603", kind: "movie", id: 603 }))).episodes, []);
});

test("si el servidor no sirve fotogramas con nota, los pone TMDB", async () => {
  const plugin = await freshPlugin();
  setKino({ config: { key: KEY, service: "rpdb" }, fetchImpl: postersOnlyFetch });
  const out = await plugin.episodes(JSON.stringify({ kind: "tv", id: 1399, list: true }));
  assert.equal(out.episodes[0].still, "https://image.tmdb.org/t/p/w300/s1e1.jpg");
  // El capítulo de la temporada 2 no trae still en el fixture: se queda sin imagen, no con una rota.
  assert.equal(out.episodes[1].still, undefined);
  // El póster de la serie sí lleva su nota: el fallo del fotograma no arrastra al póster.
  assert.match(out.series.poster, /^https:\/\/api\.ratingposterdb\.com\//);
});

test("meta() rellena el póster de un título de OTRA fuente, y solo el póster", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY, service: "rpdb" }, fetchImpl: okFetch });
  const answer = await plugin.meta({ type: "movie", ids: { imdb: "tt0133093" } });
  assert.equal(answer.poster, RPDB + "/" + KEY + "/imdb/poster-default/tt0133093.jpg?fallback=true");
  // Nunca un fondo de RPDB: son de pago y dejarían la tarjeta vacía en una tele.
  assert.equal(answer.backdrop, undefined);
  assert.equal(asked.fetch.length, 1);
  // Kino da SEIS segundos a meta(); la sonda no puede pedir diez o se come la llamada entera, y tres
  // tiempos agotados seguidos apagan el plugin. Esta es la regresión que hay que vigilar.
  assert.ok(asked.fetch[0].timeoutMs <= 2000, "sonda de meta(): " + asked.fetch[0].timeoutMs + " ms");

  // Sin clave no responde nada: no hay nada que rellenar.
  setKino({ config: {}, fetchImpl: okFetch });
  assert.equal(await plugin.meta({ type: "movie", ids: { imdb: "tt0133093" } }), null);
});

test("las filas se titulan en el idioma de Kino", async () => {
  const plugin = await freshPlugin();
  setKino({ config: { key: KEY }, lang: "en-US", fetchImpl: okFetch });
  const rows = await plugin.home();
  assert.equal(filmsRow(rows).title, "Trending movies");
  assert.equal(film0(await plugin.home()).poster.includes("/tmdb/"), true);
});

test("resolve() falla con not_found y una frase en el idioma de la persona", async () => {
  let plugin = await freshPlugin();
  setKino({ config: {}, lang: "es-CO" });
  await assert.rejects(() => plugin.resolve("x"), (e) => e.code === "not_found" && /no reproduce/.test(e.userMessage));

  plugin = await freshPlugin();
  setKino({ config: {}, lang: "en-US" });
  await assert.rejects(() => plugin.resolve("x"), (e) => e.code === "not_found" && /plays nothing/.test(e.userMessage));
});

test("con respuestas REALES de TMDB los títulos salen completos", async () => {
  // Todas las demás pruebas usan datos que escribí yo. Esta usa lo que TMDB devolvió de verdad el día que
  // se grabó `test/tmdb-real.json` (con el kit: `KINO_TMDB_KEY=… node sdk/run.mjs --raw . home`). Es la que
  // cazaría un cambio de TMDB: un campo que se llame distinto, o que deje de venir.
  const real = (path, params) => {
    for (const caso of Object.values(REAL)) {
      if (!caso || !caso.path || caso.path !== path) continue;
      const coincide = Object.keys(caso.params).every((k) => params[k] === caso.params[k]);
      if (coincide) return caso.body;
    }
    return { results: [], total_pages: 1 };
  };

  const plugin = await freshPlugin();
  setKino({ config: { key: KEY, service: "openposterdb" }, device: "tv", fetchImpl: okFetch, tmdbImpl: real });
  const rows = await plugin.home();

  // De las once filas, las que tienen datos reales grabados: Anime (de /discover/tv) y Series en tendencia.
  const anime = rows.find((r) => r.id === "rpdb-anime");
  assert.ok(anime, "la fila de Anime tiene que salir con datos reales");
  assert.equal(anime.items.length, 20);
  assert.ok(anime.items.every((i) => i.poster && i.ids.tmdb && i.title), "todos con póster, id y título");
  assert.ok(anime.items.every((i) => /^https:\/\/openposterdb\.com\//.test(i.poster)), "el póster va al servidor");

  // Y el dato que sostiene todo el Home por categorías: los géneros llegan de verdad.
  const conGeneros = anime.items.filter((i) => i.genres && i.genres.length);
  assert.ok(conGeneros.length >= 18, "casi todos con géneros: " + conGeneros.length + " de " + anime.items.length);
  const conocidos = ["accion", "animacion", "aventura", "belica", "ciencia-ficcion", "comedia", "crimen", "drama", "entretenimiento", "familia", "fantasia", "historia", "misterio", "musical", "reality", "romance", "suspenso", "terror", "western"];
  for (const it of conGeneros) {
    for (const g of it.genres) assert.ok(conocidos.includes(g), "género fuera del vocabulario de Kino: " + g);
  }

  // Y la sección, con el cuerpo real de /movie/popular.
  const otra = await freshPlugin();
  setKino({ config: { key: KEY, service: "rpdb" }, device: "tv", fetchImpl: okFetch, tmdbImpl: real });
  const populares = await otra.section({ tab: "populares" });
  const pelis = populares.rows.find((r) => r.id === "sec-pop-movies");
  assert.ok(pelis && pelis.items.length === 20, "la fila de películas populares sale con datos reales");
  assert.ok(pelis.items.every((i) => i.ids.tmdb && i.poster));
});

test("la lupa dentro de una página busca en TMDB, y solo donde se puede", async () => {
  // scopedSearch: la persona escribe en la lupa de un "Ver más". Sin esto, Kino solo filtra los títulos
  // que ya tiene cargados, así que buscar «naruto» dentro de Anime solo encontraba algo si Naruto estaba
  // entre las primeras tarjetas.
  const animeRef = JSON.stringify({
    path: "/discover/tv",
    kind: "tv",
    params: { with_genres: 16, with_original_language: "ja", sort_by: "popularity.desc" },
    list: true,
  });

  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY, service: "openposterdb" }, device: "tv", fetchImpl: okFetch });
  await plugin.search({ q: "naruto", within: animeRef });

  // Se le preguntó a TMDB con el género Y el texto: la búsqueda es DENTRO del género.
  const pedido = asked.tmdb.find((c) => c.path === "/discover/tv" && c.params.with_text_query === "naruto");
  assert.ok(pedido, "tiene que pedir /discover/tv con with_text_query");
  assert.equal(pedido.params.with_genres, 16, "respetando el género de la página");
  assert.equal(pedido.params.with_original_language, "ja", "y el resto de parámetros de esa página");
  assert.equal(pedido.params.language, "es-MX");

  // Una página que NO sabe filtrar por texto devuelve null, y Kino filtra lo que tiene cargado: devolver
  // la página entera sería peor que no ofrecer la búsqueda.
  for (const ref of [
    JSON.stringify({ path: "/movie/popular", kind: "movie", list: true }),
    JSON.stringify({ path: "/trending/tv/week", kind: "tv", list: true }),
    "no es una ref",
    JSON.stringify({ path: "/discover/movie", kind: "tv", list: true }),
  ]) {
    const otra = await freshPlugin();
    const pedidos = setKino({ config: { key: KEY, service: "openposterdb" }, device: "tv", fetchImpl: okFetch });
    const r = await otra.search({ q: "algo", within: ref });
    assert.equal(r, null, "debe devolver null: " + ref);
    assert.ok(!pedidos.tmdb.some((c) => c.params.with_text_query), "y no debe preguntar por texto");
  }

  // Sin `within` la búsqueda es la de siempre, en todo el catálogo.
  const global = await freshPlugin();
  const pedidosGlobal = setKino({ config: { key: KEY, service: "openposterdb" }, device: "tv", fetchImpl: okFetch });
  await global.search({ q: "matrix" });
  assert.ok(pedidosGlobal.tmdb.some((c) => c.path === "/search/multi" && c.params.query === "matrix"));
});

test("lo comprobado se recuerda: un tiempo agotado ya no deja sin notas toda la sesión", async () => {
  const store = new Map();

  // --- Sesión 1: todo responde, así que el servidor queda confirmado y se guarda.
  let plugin = await freshPlugin();
  setKino({ config: { key: KEY, service: "openposterdb" }, device: "tv", fetchImpl: okFetch, store });
  const primera = await plugin.home();
  await plugin.episodes(JSON.stringify({ kind: "tv", id: 1399, list: true }));
  assert.ok(film0(primera).backdrop.includes("backdrop-default"), "la sesión 1 usa el fondo con nota");
  assert.equal(store.size, 1, "queda UNA entrada, con el servidor y la huella de la clave");
  const guardado = JSON.parse([...store.values()][0]);
  assert.ok(guardado.backdrop && guardado.still && guardado.tuning, "se guardaron las tres: " + JSON.stringify(guardado));

  // --- Sesión 2: Kino cerró el sandbox (lo hace tras cinco minutos, al cambiar un ajuste, al actualizar)
  // y AHORA el servidor va lento justo en las tres comprobaciones de capacidad. Antes, con fallar en
  // cerrado, eso significaba perder las notas durante toda la sesión.
  const lento = (url) =>
    /backdrop-default|episode-default/.test(String(url)) || /badge_size/.test(String(url))
      ? Promise.reject(new Error("se agotó el tiempo"))
      : { ok: true, status: 200, headers: {} };

  plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY, service: "openposterdb" }, device: "tv", fetchImpl: lento, store });
  const segunda = await plugin.home();
  const caps = await plugin.episodes(JSON.stringify({ kind: "tv", id: 1399, list: true }));

  assert.ok(film0(segunda).backdrop.includes("backdrop-default"), "el fondo conserva su nota");
  assert.match(film0(segunda).poster, /badge_size=/, "y el ajuste fino sigue aplicándose");
  assert.ok(caps.episodes[0].still.includes("episode-default"), "y el fotograma también");
  assert.equal(asked.fetch.length, 1, "solo se comprobó la clave: " + asked.fetch.length + " peticiones, no cuatro");

  // --- Un "no" NO se guarda: si lo que falló fue el tiempo, la próxima sesión vuelve a preguntar.
  const store2 = new Map();
  let otra = await freshPlugin();
  setKino({ config: { key: KEY, service: "openposterdb" }, device: "tv", fetchImpl: postersOnlyFetch, store: store2 });
  await otra.home();
  assert.ok(!JSON.parse([...store2.values()][0] || "{}").backdrop, "el fondo no se guardó: no funcionó");
  otra = await freshPlugin();
  const reintento = setKino({ config: { key: KEY, service: "openposterdb" }, device: "tv", fetchImpl: postersOnlyFetch, store: store2 });
  await otra.home();
  assert.ok(reintento.fetch.some((f) => /backdrop-default/.test(f.url)), "la próxima sesión lo vuelve a comprobar");

  // --- Cambiar la clave o el servidor invalida lo guardado: el almacén NO se borra al guardar ajustes.
  const store3 = new Map();
  let uno = await freshPlugin();
  setKino({ config: { key: KEY, service: "openposterdb" }, device: "tv", fetchImpl: okFetch, store: store3 });
  await uno.home();
  let dos = await freshPlugin();
  const conOtraClave = setKino({ config: { key: "otra-clave", service: "openposterdb" }, device: "tv", fetchImpl: okFetch, store: store3 });
  await dos.home();
  assert.ok(conOtraClave.fetch.some((f) => /backdrop-default/.test(f.url)), "con otra clave se comprueba de nuevo");
  assert.ok(guardado.backdrop === true && JSON.parse([...store3.values()][0]).backdrop === true, "y quedan dos entradas distintas: " + store3.size);

  // --- El botón "Probar el servidor" comprueba DE CERO: responder con una nota de hace doce horas sería
  // mentir justo cuando alguien está diagnosticando.
  plugin = await freshPlugin();
  const conBoton = setKino({ config: { key: KEY, service: "openposterdb" }, device: "tv", fetchImpl: postersOnlyFetch, store });
  await plugin.action("testServer");
  assert.ok(conBoton.fetch.some((f) => /backdrop-default/.test(f.url)), "el botón no se fía de lo guardado");
  const despuesDelBoton = JSON.parse([...store.values()][0] || "{}");
  assert.ok(!despuesDelBoton.backdrop, "el fondo falló: no puede quedar guardado de antes");
  assert.equal(despuesDelBoton.tuning, true, "y lo que sí funcionó se guarda de nuevo");

  // --- Y sin almacén (un Kino que no lo tuviera) todo funciona igual, solo que sin recordar.
  plugin = await freshPlugin();
  const sinAlmacen = setKino({ config: { key: KEY, service: "openposterdb" }, device: "tv", fetchImpl: okFetch, storage: false });
  const sinNada = await plugin.home();
  assert.ok(film0(sinNada).backdrop.includes("backdrop-default"));
  assert.ok(sinAlmacen.fetch.length >= 2, "comprueba igual: " + sinAlmacen.fetch.length + " peticiones");
});

test("validateSettings rechaza lo que se guardaría y luego se ignoraría en silencio", async () => {
  const plugin = await freshPlugin();

  // Un tipo de póster que no puede funcionar: hoy se guarda tal cual y el plugin cae al de fábrica sin
  // decir nada. Una mayúscula NO es un problema (el plugin la normaliza), así que aquí no entra.
  for (const malo of ["Poster Película", "poster pelicula", "ab", "con_guion_bajo", "poster/defecto"]) {
    const r = await plugin.validateSettings({ posterType: malo });
    assert.ok(r && r.posterType, "debería rechazar: «" + malo + "»");
    assert.ok(r.posterType.length <= 200, "el mensaje de Kino admite 200 caracteres");
  }

  // La clave gratuita con RatingPosterDB: el servidor la rechaza, la sonda lo nota y TODAS las imágenes
  // vuelven a TMDB, sin notas y sin explicación. Se corta antes de guardar.
  const cruce = await plugin.validateSettings({ service: "rpdb", key: "t0-free-rpdb" });
  assert.ok(cruce && cruce.key, "avisa del cruce de clave y servidor");
  assert.ok(cruce.key.length <= 200);

  // Y una clave con espacios, que el servidor rechaza con un mensaje que no ayuda a nadie.
  assert.ok((await plugin.validateSettings({ key: "mi clave" })).key);

  // Lo correcto se acepta con null: la clave gratuita CON su servidor, un tipo bien escrito, uno con
  // mayúsculas (el plugin las normaliza) y un valor vacío (significa el de fábrica).
  assert.equal(await plugin.validateSettings({ service: "openposterdb", key: "t0-free-rpdb", posterType: "poster-default" }), null);
  assert.equal(await plugin.validateSettings({ posterType: "poster-imdb-rated" }), null);
  assert.equal(await plugin.validateSettings({ posterType: "Poster-Default" }), null);
  assert.equal(await plugin.validateSettings({ posterType: "" }), null);
  // Y la clave gratuita con SU servidor tampoco es un problema, aunque venga con espacios alrededor.
  assert.equal(await plugin.validateSettings({ service: "openposterdb", key: "  t0-free-rpdb  " }), null);
  // Sin valores (o con algo que no es un objeto) tampoco inventa problemas.
  assert.equal(await plugin.validateSettings({}), null);
  assert.equal(await plugin.validateSettings(null), null);
});

test("los archivos publicados no llevan tildes literales: el celular las lee como Latin-1", async () => {
  // Comprobado contra el archivo publicado: GitHub sirve `text/plain; charset=utf-8` y los bytes son
  // correctos, pero la app en Android los decodifica como Latin-1 y "imágenes" se ve "imÃ¡genes". La tele
  // lo lee bien. Con escapes \uXXXX el carácter lo produce el escape, no los bytes: da igual la adivinanza.
  // Si algún día se añade un texto nuevo con tilde, hay que volver a pasar `explore/escape-unicode.mjs`.
  const manifestRaw = readFileSync(join(root, "kino-plugin.json"), "utf8");
  assert.ok(!/[^\x00-\x7F]/.test(manifestRaw), "el manifiesto debe ser ASCII puro");

  const source = readFileSync(join(root, "plugin.js"), "utf8");
  const sinComentarios = source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
  const sobran = sinComentarios.match(/[^\x00-\x7F]/g) || [];
  assert.deepEqual(sobran, [], "fuera de los comentarios, ninguna tilde literal");
});

test("sin mojibake: el texto corrompido no puede volver a colarse", async () => {
  // Esto ya pasó una vez y el guardia de arriba NO lo cazó: el manifiesto era ASCII puro y sin tildes
  // literales, pero porque las tildes estaban corrompidas a «Ã³» y luego escapadas fielmente. El fallo
  // vino de leer y reescribir el archivo con PowerShell (`Get-Content -Raw` + `Set-Content -Encoding utf8`
  // lee el UTF-8 como Windows-1252 y lo escribe doble). Así que hay que mirar el TEXTO YA INTERPRETADO.
  const texto = JSON.stringify(manifest);
  const malas = texto.match(/Ã.|Â./g) || [];
  assert.deepEqual(malas, [], "mojibake en el manifiesto: " + malas.join(" "));

  const source = readFileSync(join(root, "plugin.js"), "utf8");
  const sinComentarios = source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
  const malasJs = sinComentarios.match(/Ã.|Â./g) || [];
  assert.deepEqual(malasJs, [], "mojibake en plugin.js: " + malasJs.join(" "));
});

test("kino.tmdb solo se usa detrás de typeof, y el archivo no usa nada que QuickJS no tenga", () => {
  const source = readFileSync(join(root, "plugin.js"), "utf8");
  assert.match(source, /typeof kino\.tmdb !== "function"/);   // kino.tmdb solo existe desde Kino 0.9.53
  const forbidden = [
    [/(?<!kino\.)\bfetch\s*\(/, "fetch() (usa kino.fetch)"],
    [/[^.\w]setTimeout\s*\(/, "setTimeout (usa kino.sleep)"],
    [/\brequire\s*\(/, "require"],
    [/\bBuffer\b/, "Buffer"],
    [/\bprocess\./, "process"],
    [/(?<!kino\.)\bcrypto\b/, "crypto (usa kino.crypto)"],
    [/\bIntl\./, "Intl"],
    [/^\s*import\s/m, "import (un plugin es un solo archivo)"],
    [/^\s*export\s+default/m, "export default (usa export con nombre)"],
  ];
  for (const [re, what] of forbidden) assert.ok(!re.test(source), "no debería usar " + what);
});

test("la posición se decide por imagen: el fondo se elige, el póster y el capítulo van fijos", async () => {
  const onTv = (extra) => ({ key: KEY, service: "openposterdb", ...extra });

  // El póster va SIEMPRE abajo y centrado, y el capítulo SIEMPRE arriba a la derecha, diga lo que diga el
  // ajuste: una sola posición para las tres imágenes cambiaba también los pósters y los capítulos.
  let plugin = await freshPlugin();
  setKino({ config: onTv({ backdropPosition: "br" }), device: "tv", fetchImpl: okFetch });
  let rows = await plugin.home();
  assert.ok(film0(rows).poster.includes("position=bc"), "el póster va fijo abajo");
  assert.ok(!film0(rows).poster.includes("position=br"));

  plugin = await freshPlugin();
  setKino({ config: onTv({ backdropPosition: "br" }), device: "tv", fetchImpl: okFetch });
  const out = await plugin.episodes(JSON.stringify({ kind: "tv", id: 1399, list: true }));
  assert.ok(out.episodes[0].still.includes("position=tr"), "el capítulo va fijo arriba a la derecha");

  // El fondo sí es la persona: cada valor viaja en su dirección.
  for (const position of ["bc", "tc", "br", "l"]) {
    plugin = await freshPlugin();
    setKino({ config: onTv({ backdropPosition: position }), device: "tv", fetchImpl: okFetch });
    rows = await plugin.home();
    assert.ok(film0(rows).backdrop.includes("position=" + position), position);
  }

  // "Auto" ya no existe, y un valor raro cae en el de fábrica: centrada a la derecha, que es lo que se
  // pidió al ver que en una esquina quedaba pegada al borde de la pantalla del celular.
  for (const value of ["auto", "donde-sea"]) {
    plugin = await freshPlugin();
    setKino({ config: onTv({ backdropPosition: value }), device: "tv", fetchImpl: okFetch });
    const back = film0(await plugin.home()).backdrop;
    assert.ok(back.includes("position=r"), "cae en centrada a la derecha: " + value);
    assert.ok(back.includes("badge_size="), "el resto del ajuste sigue aplicándose");
  }

  // Y en el celular la posición TAMBIÉN se aplica: es una propiedad de la imagen, no de la pantalla.
  plugin = await freshPlugin();
  setKino({ config: onTv({ backdropPosition: "tc" }), fetchImpl: okFetch });
  const phone = film0(await plugin.home());
  assert.ok(phone.backdrop.includes("position=tc"), "la posición va en el celular");
  assert.ok(!phone.poster.includes("badge_size"), "pero el tamaño de la nota sigue siendo de la tele");
});

test("el póster y el fondo se configuran por separado", async () => {
  // Es lo que se pidió: hasta ahora una sola elección de notas y de tamaño se aplicaba a las dos clases
  // de imagen, y el póster es vertical y el fondo apaisado. Ahora cada uno tiene su grupo de ajustes.
  const onTv = (extra) => ({ key: KEY, service: "openposterdb", ...extra });
  const plugin = await freshPlugin();
  setKino({
    config: onTv({
      posterRatings: "imdb",          // póster: una nota, la más limpia en vertical
      backdropRatings: "imdbRt",      // fondo: dos, que en apaisado caben de sobra
      posterBadgeSize: "normal",      // póster: medianas
      backdropBadgeSize: "max",       // fondo: muy grandes, y con la imagen 4K
    }),
    device: "tv",
    fetchImpl: okFetch,
  });
  const rows = await plugin.home();
  const poster = film0(rows).poster;
  const backdrop = film0(rows).backdrop;

  assert.match(poster, /position=bc&badge_size=m&ratings_order=imdb&ratings_limit=1&ratings_exclude=/);
  assert.match(backdrop, /badge_size=xl&imageSize=large&ratings_order=imdb,rt&ratings_limit=2&ratings_exclude=/);
  assert.ok(!poster.includes("imageSize"), "imageSize es del fondo, no del póster");

  // Y los capítulos siguen al grupo del fondo, porque también son apaisados (su posición va aparte).
  const out = await plugin.episodes(JSON.stringify({ kind: "tv", id: 1399, list: true }));
  assert.match(out.episodes[0].still, /position=tr&badge_size=xl&imageSize=large&ratings_order=imdb,rt&ratings_limit=2/);
});

test("el póster sin texto es opcional, y solo el fondo ofrece todas las notas", async () => {
  const onTv = (extra) => ({ key: KEY, service: "openposterdb", ...extra });

  // Apagado (que es como viene): la dirección no lleva `textless`.
  let plugin = await freshPlugin();
  setKino({ config: onTv({}), device: "tv", fetchImpl: okFetch });
  let rows = await plugin.home();
  assert.ok(!film0(rows).poster.includes("textless"));
  assert.ok(!film0(rows).backdrop.includes("textless"), "el fondo no lo lleva nunca");

  // Encendido: va en el póster y en nada más. Es un booleano documentado que el servidor acepta, así que
  // no necesita sonda; cuando no hay versión sin texto sirve la normal.
  plugin = await freshPlugin();
  setKino({ config: onTv({ posterTextless: true }), device: "tv", fetchImpl: okFetch });
  rows = await plugin.home();
  assert.match(film0(rows).poster, /textless=true/);
  assert.ok(!film0(rows).backdrop.includes("textless"));

  // "Todas las que haya" en el fondo: ocho y sin exclusiones, que es lo que cabe en una fila apaisada.
  plugin = await freshPlugin();
  setKino({ config: onTv({ backdropRatings: "all", posterRatings: "imdbRtMc" }), device: "tv", fetchImpl: okFetch });
  rows = await plugin.home();
  assert.match(film0(rows).backdrop, /ratings_limit=8&fallback=true$/);
  assert.ok(!film0(rows).backdrop.includes("ratings_exclude"), "todas quiere decir sin exclusiones");
  assert.match(film0(rows).poster, /ratings_limit=3&ratings_exclude=/, "el póster mantiene su tope");
});

test("cada título lleva sus géneros, que es lo que llena las filas del Home por categorías", async () => {
  // Kino arma ese Home con los `genres` de cada ÍTEM: sin ellos un título cae solo en la fila genérica
  // ("Películas") y no aparece nunca en Acción, Comedia, Drama… Por eso se traducen los géneros de TMDB a
  // los ids de Kino.
  const plugin = await freshPlugin();
  setKino({ config: { key: KEY, service: "rpdb" }, device: "tv", fetchImpl: okFetch });
  const rows = await plugin.home();

  // 28 -> accion y 878 -> ciencia-ficcion, en el orden en que llegan.
  assert.deepEqual(film0(rows).genres, ["accion", "ciencia-ficcion"]);
  // Un título sin géneros no lleva el campo: mejor ausente que una lista vacía.
  assert.equal(filmsRow(rows).items[1].genres, undefined);

  // Dos ids de TMDB que son el mismo género de Kino cuentan una vez, y nunca pasan de cinco.
  const kids = rows.find((r) => r.id === "rpdb-kids").items[0];
  assert.deepEqual(kids.genres, ["animacion", "familia", "comedia", "aventura", "fantasia"]);
  const dorama = rows.find((r) => r.id === "rpdb-doramas").items[0];
  assert.deepEqual(dorama.genres, ["drama"]);

  // Un id de TIPO (anime, documentales, infantil…) no va aquí: Kino lo ignora en `genres`. El tipo lo da
  // el `genre` de la fila — y de ahí que las filas temáticas vayan primero en el Inicio.
  assert.equal(rows.find((r) => r.id === "rpdb-anime").genre, "anime");
  assert.equal(rows.find((r) => r.id === "rpdb-kids").genre, "infantil");
  assert.equal(rows.find((r) => r.id === "rpdb-doramas").genre, "doramas");
  assert.ok(!(rows.find((r) => r.id === "rpdb-anime").items[0].genres || []).includes("anime"));
});

test("un título no se repite entre filas", async () => {
  // Las listas de TMDB se solapan, y Kino solo comprueba repeticiones DENTRO de una fila. Sin cruzarlas,
  // la misma película salía en Tendencias, Mejor valoradas y En cines del mismo Inicio.
  const plugin = await freshPlugin();
  setKino({ config: { key: KEY, service: "rpdb" }, device: "tv", fetchImpl: okFetch });
  const rows = await plugin.home();

  const trend = rows.find((r) => r.id === "rpdb-trend-movies");
  const top = rows.find((r) => r.id === "rpdb-top-movies");
  assert.ok(trend.items.some((i) => i.id === "mv-607"), "sale en la primera fila que lo trae");
  assert.ok(!top.items.some((i) => i.id === "mv-607"), "y no se repite en la siguiente");
  assert.ok(top.items.some((i) => i.id === "mv-605"), "la fila conserva lo que no se había visto");

  // Ninguna fila repite un id ya usado por otra.
  const ids = rows.flatMap((r) => r.items.map((i) => i.id));
  assert.equal(new Set(ids).size, ids.length);

  // Y la sección usa el mismo constructor, así que se comporta igual.
  const section = await plugin.section({ tab: "pelis" });
  const sectionIds = section.rows.flatMap((r) => r.items.map((i) => i.id));
  assert.equal(new Set(sectionIds).size, sectionIds.length);
});

test("section() arma su sección con pestañas, destacado y filas", async () => {
  const plugin = await freshPlugin();
  setKino({ config: { key: KEY, service: "rpdb" }, fetchImpl: okFetch });
  const out = await plugin.section({ tab: null });
  // Dos pestañas por lo que el título ES, y cuatro por lo que la lista ES.
  assert.deepEqual(out.tabs.map((t) => t.id), ["pelis", "series", "hoy", "populares", "mejor", "generos"]);
  assert.deepEqual(out.tabs.map((t) => t.label), ["Películas", "Series", "Tendencias de hoy", "Populares", "Mejor valoradas", "Géneros"]);
  assert.equal(out.tab, "pelis");
  // El destacado sale del primer título de la primera fila: no cuesta ninguna petición de más.
  assert.equal(out.hero.title, "Matrix");
  assert.ok(out.hero.image, "el destacado lleva imagen");
  // "En cines" viene vacía en el fixture, así que esa fila no aparece.
  assert.deepEqual(out.rows.map((r) => r.id), ["sec-movies-trend", "sec-movies-soon", "sec-movies-docs", "sec-movies-kids", "sec-movies-top"]);
  assert.ok(out.rows[0].ref, "cada fila trae su Ver más");

  const series = await plugin.section({ tab: "series" });
  assert.equal(series.tab, "series");
  assert.deepEqual(series.rows.map((r) => r.id), ["sec-shows-trend", "sec-shows-air", "sec-shows-anime", "sec-shows-doramas", "sec-shows-pop", "sec-shows-top"]);
  assert.equal(series.hero.title, "Juego de tronos");

  // "Tendencias de hoy" es lo del día, no lo de la semana: es la fila que pidió el usuario.
  const hoy = await plugin.section({ tab: "hoy" });
  assert.deepEqual(hoy.rows.map((r) => r.id), ["sec-today-movies", "sec-today-shows"]);
  assert.equal(hoy.rows[0].title, "Películas en tendencia hoy");
  assert.deepEqual(refOf(hoy.rows[0]).path, "/trending/movie/day");

  const populares = await plugin.section({ tab: "populares" });
  assert.deepEqual(populares.rows.map((r) => r.id), ["sec-pop-movies", "sec-pop-shows", "sec-pop-air"]);

  const mejor = await plugin.section({ tab: "mejor" });
  assert.deepEqual(mejor.rows.map((r) => r.id), ["sec-top-movies", "sec-top-shows"]);

  // La pestaña de géneros: seis filas, cada una con su género en el ref.
  const generos = await plugin.section({ tab: "generos" });
  assert.equal(generos.rows.length, 6);
  assert.deepEqual(generos.rows.map((r) => refOf(r).params.with_genres), [28, 35, 27, 878, 16, 99]);
  assert.equal(generos.rows[0].title, "Acción");

  // Una pestaña que no existe cae a la primera, no falla.
  assert.equal((await plugin.section({ tab: "otra" })).tab, "pelis");
  assert.equal((await plugin.section(null)).tab, "pelis");
});

test("categories() arma los mosaicos, con arte y referencia navegable", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY, service: "rpdb" }, fetchImpl: okFetch });
  const tiles = await plugin.categories();
  assert.ok(tiles.length > 0 && tiles.length <= 24, "Kino admite hasta 24 mosaicos");

  // Primero las listas (lo que en el Inicio no puede ser un chip) y después los géneros.
  assert.deepEqual(tiles.slice(0, 2).map((t) => t.title), ["Tendencias de hoy", "Más populares"]);
  assert.equal(JSON.parse(tiles[0].ref).path, "/trending/movie/day");
  assert.equal(tiles.filter((t) => JSON.parse(t.ref).path === "/discover/movie").length, 8);   // 6 géneros + docs + anime

  // El arte del mosaico es el póster con nota del título más popular de esa lista.
  assert.match(tiles[0].art, /^https:\/\/api\.ratingposterdb\.com\//);
  for (const tile of tiles) {
    assert.ok(tile.title.length <= 40, tile.title);
    assert.match(JSON.parse(tile.ref).path, /^\/(discover|trending|movie|tv)/);
  }

  // Y un mosaico de género se abre de verdad: los parámetros llegan a TMDB y `page` manda.
  const genero = tiles.find((t) => t.title === "Acción");
  const page = await plugin.browse(genero.ref, null);
  assert.equal(page.items[0].id, "mv-810");
  assert.equal(page.next, "2");
  const call = asked.tmdb[asked.tmdb.length - 1];
  assert.equal(call.path, "/discover/movie");
  assert.equal(call.params.with_genres, 28);
  assert.equal(call.params.sort_by, "popularity.desc");
  assert.equal(call.params.page, 1);

  // Y el de lista también, sin parámetros de género.
  const hoy = await plugin.browse(tiles[0].ref, null);
  assert.equal(hoy.items[0].id, "mv-800");
  assert.equal(asked.tmdb[asked.tmdb.length - 1].path, "/trending/movie/day");
});

test("un ref no puede colar parámetros raros", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY, service: "rpdb" }, fetchImpl: okFetch });
  const ref = JSON.stringify({
    path: "/discover/movie",
    kind: "movie",
    params: { with_genres: 28, "mal nombre": 1, raro: { a: 1 }, lista: [1, 2], ok: true, largo: "x".repeat(600) },
  });
  await plugin.browse(ref, null);
  // Solo pasan los nombres y valores simples: un objeto, una lista, un nombre raro o un texto larguísimo
  // se quedan fuera antes de llegar a TMDB. `language` y `page` los pone el plugin.
  assert.deepEqual(Object.keys(asked.tmdb[asked.tmdb.length - 1].params).sort(), ["language", "ok", "page", "with_genres"]);
});

test("el formulario dice qué funciona, y el botón lo comprueba de cero", async () => {
  const plugin = await freshPlugin();
  let rejectKey = true;
  setKino({
    config: { key: "mala", service: "openposterdb" },
    device: "tv",
    fetchImpl: () => (rejectKey ? { ok: false, status: 403, headers: {} } : okFetch()),
  });

  // Con la clave rechazada, el estado lo dice tal cual.
  const bad = await plugin.settingsStatus();
  assert.ok(typeof bad.serverStatus === "string" && bad.serverStatus.length <= 200);
  assert.match(bad.serverStatus, /rechazó la clave/);

  // El botón vuelve a comprobar de cero: al arreglarla, todo sale en verde.
  rejectKey = false;
  const message = (await plugin.action("testServer")).message;
  assert.ok(message.length <= 300, "Kino admite 300 caracteres");
  assert.match(message, /clave ✓/);
  assert.match(message, /fondos con nota ✓/);
  assert.match(message, /fotogramas ✓/);
  assert.match(message, /ajuste de notas ✓/);

  // Y el estado que Kino pide justo después de la acción ya cuenta lo nuevo.
  assert.match((await plugin.settingsStatus()).serverStatus, /clave ✓/);

  // Una acción que no existe no revienta.
  assert.ok((await plugin.action("lo-que-sea")).message);
});

test("sin clave, el estado lo dice en vez de callarse", async () => {
  const plugin = await freshPlugin();
  setKino({ config: {}, fetchImpl: okFetch });
  assert.match((await plugin.settingsStatus()).serverStatus, /Sin clave/);
  assert.match((await plugin.action("testServer")).message, /Sin clave/);
});

test("un Kino sin kino.tmdb no aporta filas en vez de reventar", async () => {
  // El plugin no lleva llave de TMDB propia: en un Kino anterior a la 0.9.53 no hay puerta a TMDB, así
  // que el Inicio simplemente no aporta filas en lugar de fallar y quedarse sin responder.
  const plugin = await freshPlugin();
  setKino({ config: { key: KEY }, fetchImpl: okFetch, withTmdb: false });
  assert.deepEqual(await plugin.home(), []);

  // Una búsqueda sí lo dice con un código, porque la pidió la persona.
  await assert.rejects(() => plugin.search({ q: "matrix" }), (e) => e.code === "unavailable");
});
