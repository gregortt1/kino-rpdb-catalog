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

// plugin.js remembers per runtime whether the RPDB key was rejected, so a fresh copy keeps tests apart.
let version = 0;
function freshPlugin() {
  version += 1;
  return import(entry + "?v=" + version);
}

const KEY = "clave-de-prueba";
const RPDB = "https://api.ratingposterdb.com";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

const FILM = { id: 603, title: "Matrix", release_date: "1999-03-31", poster_path: "/matrix.jpg", backdrop_path: "/matrix-b.jpg", overview: "Neo despierta.", vote_average: 8.2 };
const NO_ART = { id: 77, title: "Sin arte", release_date: "2001-01-01" };
const SHOW = { id: 1399, name: "Juego de tronos", first_air_date: "2011-04-17", poster_path: "/got.jpg", vote_average: 9.2 };
const SEASON_1 = { season_number: 1, episodes: [
  { season_number: 1, episode_number: 1, name: "Se acerca el invierno", still_path: "/s1e1.jpg", air_date: "2011-04-17", runtime: 62, overview: "Ned Stark." },
  { season_number: 1, episode_number: 0, name: "Especial", air_date: "2010-01-01" },   // number 0: Kino lo descarta
] };
const SEASON_2 = { season_number: 2, episodes: [
  { season_number: 2, episode_number: 1, name: "El norte recuerda", air_date: "2012-04-01", runtime: 53 },
] };

const TMDB = {
  "/trending/movie/week": { results: [FILM, NO_ART], total_pages: 3 },
  "/trending/tv/week": { results: [SHOW], total_pages: 1 },
  "/movie/top_rated": { results: [FILM], total_pages: 1 },
  "/tv/top_rated": { results: [SHOW], total_pages: 1 },
  "/movie/now_playing": { results: [], total_pages: 1 },      // una fila sin ítems no debe aparecer
  "/tv/on_the_air": { results: [SHOW], total_pages: 1 },
  "/search/multi": { results: [{ ...FILM, media_type: "movie" }, { ...SHOW, media_type: "tv" }, { id: 9, name: "Gente", media_type: "person" }], total_pages: 2 },
  "/tv/1399": { id: 1399, name: "Juego de tronos", overview: "Invierno.", poster_path: "/got.jpg", seasons: [{ season_number: 0, episodes: [] }, { season_number: 1 }, { season_number: 2 }] },
  "/tv/1399/season/1": SEASON_1,
  "/tv/1399/season/2": SEASON_2,
};

/** The kino globals, as Kino gives them. Returns what the plugin asked for. */
function setKino({ config = {}, lang = "es-CO", fetchImpl, withTmdb = true } = {}) {
  const asked = { tmdb: [], fetch: [] };
  globalThis.kino = {
    lang,
    config: { get: (name) => config[name] },
    log: () => {},
    error: (code, message, extra) => Object.assign(new Error(message || code), { code }, extra || {}),
    fetch: async (url, options) => {
      asked.fetch.push({ url: String(url), method: (options && options.method) || "GET" });
      return fetchImpl ? fetchImpl(String(url), options) : { ok: true, status: 200, headers: {} };
    },
  };
  if (withTmdb) {
    globalThis.kino.tmdb = async (path, params) => {
      asked.tmdb.push({ path, params });
      return Object.prototype.hasOwnProperty.call(TMDB, path) ? TMDB[path] : { results: [], total_pages: 1 };
    };
  }
  return asked;
}

const okFetch = () => ({ ok: true, status: 200, headers: {} });
const refOf = (o) => JSON.parse(o.ref);

test("el manifiesto es el que Kino instala", async () => {
  const r = await validate(root);
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.drops, []);
  assert.equal(manifest.apiVersion, 6);        // meta y userMessage: Kino 0.9.50 o superior
  assert.equal(manifest.catalogOnly, true);     // lista y describe, nunca reproduce
  assert.deepEqual(manifest.capabilities.sort(), ["browse", "episodes", "home", "meta", "resolve", "search"]);
  // api.themoviedb.org solo hace falta para el kino.fetch de respaldo de Kino 0.9.52 y anteriores.
  assert.ok(manifest.hosts.includes("api.ratingposterdb.com"));
  assert.ok(manifest.settings.some((s) => s.key === "key" && s.type === "password" && !s.required));
  assert.ok(manifest.settings.some((s) => s.key === "tmdbKey" && s.type === "password"));
});

test("home() arma las filas de TMDB y cada ítem lleva su póster de RPDB", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY }, fetchImpl: okFetch });
  const rows = await plugin.home();

  // La fila "En cines" viene vacía en el fixture, así que no debe aparecer.
  assert.deepEqual(rows.map((r) => r.id), ["rpdb-trend-movies", "rpdb-trend-shows", "rpdb-top-movies", "rpdb-top-shows", "rpdb-on-air"]);
  assert.equal(rows[0].title, "Películas en tendencia");
  assert.equal(rows[0].genre, "peliculas");
  assert.ok(rows[0].ref, "una fila con ref y browse() tiene la tarjeta Ver más");

  const film = rows[0].items[0];
  assert.equal(film.id, "mv-603");
  assert.equal(film.kind, "movie");
  assert.equal(film.year, "1999");
  assert.deepEqual(film.ids, { tmdb: 603 });
  assert.equal(film.poster, RPDB + "/" + KEY + "/tmdb/poster-default/603.jpg?fallback=true");
  assert.equal(film.backdrop, "https://image.tmdb.org/t/p/w780/matrix-b.jpg");   // fondos con nota: apagado

  // Un título sin arte propio se deja en blanco: RPDB construye sus pósters sobre el arte de TMDB.
  assert.equal(rows[0].items[1].poster, undefined);
  assert.deepEqual(asked.tmdb.map((c) => c.path).sort(), ["/movie/now_playing", "/movie/top_rated", "/trending/movie/week", "/trending/tv/week", "/tv/on_the_air", "/tv/top_rated"]);
  assert.equal(asked.tmdb[0].params.language, "es-MX");
});

test("sin clave de RPDB el catálogo funciona igual, con los pósters de TMDB", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: {}, fetchImpl: okFetch });
  const rows = await plugin.home();
  assert.equal(rows[0].items[0].poster, TMDB_IMG + "/matrix.jpg");
  assert.deepEqual(asked.fetch, [], "sin clave no hay nada que comprobar");
});

test("posterSource=tmdb usa los pósters originales aunque haya clave", async () => {
  const plugin = await freshPlugin();
  setKino({ config: { key: KEY, posterSource: "tmdb" }, fetchImpl: okFetch });
  const rows = await plugin.home();
  assert.equal(rows[0].items[0].poster, TMDB_IMG + "/matrix.jpg");
});

test("una clave rechazada cae a los pósters de TMDB, sin imágenes rotas y con una sola sonda", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: "mala" }, fetchImpl: () => ({ ok: false, status: 403, headers: {} }) });
  const rows = await plugin.home();
  assert.equal(rows[0].items[0].poster, TMDB_IMG + "/matrix.jpg");
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
  const asked = setKino({ config: { key: KEY }, fetchImpl: okFetch });
  const out = await plugin.episodes(JSON.stringify({ kind: "tv", id: 1399, list: true }));
  assert.equal(out.series.title, "Juego de tronos");
  assert.equal(out.series.poster, RPDB + "/" + KEY + "/tmdb/poster-default/1399.jpg?fallback=true");
  assert.deepEqual(out.episodes.map((e) => [e.season, e.number]), [[1, 1], [2, 1]]);
  const first = out.episodes[0];
  assert.equal(first.title, "Se acerca el invierno");
  assert.equal(first.airDate, "2011-04-17");
  assert.equal(first.runtimeMinutes, 62);
  assert.equal(first.still, "https://image.tmdb.org/t/p/w300/s1e1.jpg");
  assert.deepEqual(refOf(first), { kind: "tv", id: 1399, s: 1, e: 1 });
  // La temporada 0 (especiales) no se pide; las demás sí.
  assert.deepEqual(asked.tmdb.map((c) => c.path), ["/tv/1399", "/tv/1399/season/1", "/tv/1399/season/2"]);

  // El ref que item() entrega de verdad (con path) da lo mismo: episodes() solo necesita kind e id.
  const viaItemRef = await plugin.episodes(JSON.stringify({ path: "/tv/1399", kind: "tv", id: 1399, list: true }));
  assert.deepEqual(viaItemRef.episodes.map((e) => [e.season, e.number]), [[1, 1], [2, 1]]);
  // Y el ref de una película no lista capítulos.
  assert.deepEqual((await plugin.episodes(JSON.stringify({ path: "/movie/603", kind: "movie", id: 603 }))).episodes, []);
});

test("meta() rellena el póster de un título de OTRA fuente", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY, withBackdrop: true }, fetchImpl: okFetch });
  const answer = await plugin.meta({ type: "movie", ids: { imdb: "tt0133093" } });
  assert.equal(answer.poster, RPDB + "/" + KEY + "/imdb/poster-default/tt0133093.jpg?fallback=true");
  assert.equal(answer.backdrop, RPDB + "/" + KEY + "/imdb/backdrop-default/tt0133093.jpg?fallback=true");
  assert.equal(asked.fetch.length, 1);

  // Sin clave, o con la fuente en TMDB, no responde nada: no hay nada que rellenar.
  setKino({ config: {}, fetchImpl: okFetch });
  assert.equal(await plugin.meta({ type: "movie", ids: { imdb: "tt0133093" } }), null);
  setKino({ config: { key: KEY, posterSource: "tmdb" }, fetchImpl: okFetch });
  assert.equal(await plugin.meta({ type: "movie", ids: { imdb: "tt0133093" } }), null);
});

test("las filas se titulan en el idioma de Kino", async () => {
  const plugin = await freshPlugin();
  setKino({ config: { key: KEY }, lang: "en-US", fetchImpl: okFetch });
  const rows = await plugin.home();
  assert.equal(rows[0].title, "Trending movies");
  assert.equal((await plugin.home())[0].items[0].poster.includes("/tmdb/"), true);
});

test("resolve() falla con not_found y una frase en el idioma de la persona", async () => {
  let plugin = await freshPlugin();
  setKino({ config: {}, lang: "es-CO" });
  await assert.rejects(() => plugin.resolve("x"), (e) => e.code === "not_found" && /no reproduce/.test(e.userMessage));

  plugin = await freshPlugin();
  setKino({ config: {}, lang: "en-US" });
  await assert.rejects(() => plugin.resolve("x"), (e) => e.code === "not_found" && /plays nothing/.test(e.userMessage));
});

test("kino.tmdb solo se usa detrás de typeof, y el archivo no usa nada que QuickJS no tenga", () => {
  const source = readFileSync(join(root, "plugin.js"), "utf8");
  assert.match(source, /typeof kino\.tmdb === "function"/);
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

test("con un Kino sin kino.tmdb se usa el kino.fetch de respaldo y la llave de la persona", async () => {
  const plugin = await freshPlugin();
  const asked = setKino({ config: { key: KEY, tmdbKey: "llave-tmdb" }, fetchImpl: (url) => {
    if (url.includes("api.themoviedb.org")) return { ok: true, status: 200, headers: {}, json: async () => TMDB["/trending/movie/week"] };
    return okFetch();
  }, withTmdb: false });
  await plugin.home();
  const tmdbCalls = asked.fetch.filter((c) => c.url.includes("api.themoviedb.org"));
  assert.equal(tmdbCalls.length, 6);                       // las seis filas, por kino.fetch
  assert.match(tmdbCalls[0].url, /api_key=llave-tmdb/);
});
