// Kino plugin: a TMDB catalogue whose posters come from RatingPosterDB.
//
// Why this works where a `meta` plugin could not. Kino picks the image of a title in this order:
// the title's own item -> details -> AniList -> meta plugins. A `meta` plugin is last, so it can only
// fill a gap. Here the RPDB poster IS the item's own poster, which wins everywhere: the info page and
// the thumbnails of Home, search and "Ver más".
//
// The catalogue is TMDB's, and Kino supplies the TMDB key through kino.tmdb (Kino 0.9.53+), so the
// person needs no TMDB key at all. The RPDB key is the person's own and is optional: without it the
// catalogue still works, with TMDB's own posters.
//
// catalogOnly: the plugin lists and describes titles but plays none, so Kino 0.9.54+ sends its titles
// to "Buscar dónde verlo", where the person's other sources find them.

const TMDB_POSTER = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w780";
const TMDB_STILL = "https://image.tmdb.org/t/p/w300";
// RatingPosterDB by default. The person can point this at any RPDB-shaped server instead: a free
// hosted one such as openposterdb.com, or their own instance at home. A `url` setting is what makes
// that server reachable, both for kino.fetch and for the images, with no extra host to declare.
const DEFAULT_SERVER = "https://api.ratingposterdb.com";
const PROBE_ID = "tt0133093";                 // The Matrix: an id these services have always known
const DEFAULT_POSTER = "poster-default";
const DEFAULT_BACKDROP = "backdrop-default";
const ID_RULES = { imdb: /^tt\d{5,10}$/, tmdb: /^[1-9]\d{0,9}$/ };
const TYPE_RULE = /^[a-z][a-z0-9-]{2,40}$/;
const PATH_RULE = /^\/[A-Za-z0-9/_-]{0,120}$/;
const TMDB_PAGE_CAP = 500;

const TEXT = {
  es: {
    trendMovies: "Películas en tendencia",
    trendShows: "Series en tendencia",
    topMovies: "Películas mejor valoradas",
    topShows: "Series mejor valoradas",
    inCinemas: "En cines",
    onAir: "Series al aire",
    noSource: "Este catálogo no reproduce títulos: busca dónde verlo en tus otras fuentes.",
  },
  en: {
    trendMovies: "Trending movies",
    trendShows: "Trending shows",
    topMovies: "Top rated movies",
    topShows: "Top rated shows",
    inCinemas: "In cinemas",
    onAir: "On the air",
    noSource: "This catalogue plays nothing: use it to find the title in your other sources.",
  },
};

// What each Home row asks TMDB for. Six rows, six calls: well inside the 40 calls per 10 s a plugin gets.
const ROWS = [
  { id: "rpdb-trend-movies", path: "/trending/movie/week", kind: "movie", genre: "peliculas", title: "trendMovies" },
  { id: "rpdb-trend-shows", path: "/trending/tv/week", kind: "tv", genre: "series", title: "trendShows" },
  { id: "rpdb-top-movies", path: "/movie/top_rated", kind: "movie", genre: "peliculas", title: "topMovies" },
  { id: "rpdb-top-shows", path: "/tv/top_rated", kind: "tv", genre: "series", title: "topShows" },
  { id: "rpdb-cinema", path: "/movie/now_playing", kind: "movie", genre: "peliculas", title: "inCinemas" },
  { id: "rpdb-on-air", path: "/tv/on_the_air", kind: "tv", genre: "series", title: "onAir" },
];

// kino.log must never break the answer it reports on.
function log(...args) {
  try {
    kino.log(...args);
  } catch {
    // the line is lost, the answer is not
  }
}

function setting(name, fallback) {
  try {
    const value = kino.config.get(name);
    return value === undefined || value === null || value === "" ? fallback : value;
  } catch {
    return fallback;
  }
}

function appLang() {
  // Kino 0.9.53 and older always say "es-CO"; from 0.9.54 it is "es-CO" or "en-US".
  return kino.lang === "en-US" ? "en-US" : "es-CO";
}

function t(key) {
  return (appLang() === "en-US" ? TEXT.en : TEXT.es)[key];
}

// TMDB has both of these; "es-CO" is not one of its languages, so Spanish maps to es-MX.
function tmdbLang() {
  return appLang() === "en-US" ? "en-US" : "es-MX";
}

function rpdbKey() {
  return String(setting("key", "")).trim();
}

function posterType() {
  const value = String(setting("posterType", DEFAULT_POSTER)).trim().toLowerCase();
  return TYPE_RULE.test(value) ? value : DEFAULT_POSTER;
}

// The base URL of the poster server: the person's own if they set one, RatingPosterDB otherwise.
// Trailing slashes are dropped so a pasted address cannot produce a double slash.
function posterServer() {
  const configured = String(setting("server", "")).trim().replace(/\/+$/, "");
  return configured === "" ? DEFAULT_SERVER : configured;
}

function imageUrl(key, idType, type, id) {
  // fallback=true asks RPDB for the plain poster when it cannot build the rated one.
  const suffix = setting("fallback", true) === false ? "" : "?fallback=true";
  return posterServer() + "/" + encodeURIComponent(key) + "/" + idType + "/" + type + "/" + encodeURIComponent(id) + ".jpg" + suffix;
}

let probed = false;
let keyRejected = false;

// A rejected key would leave a broken image on every title, so it is worth one probe per runtime.
// Only a definite 401/403 is a verdict: a 404, a 5xx, a timeout or a HEAD RPDB does not answer say
// nothing about the key, and the answers go out anyway. Checked against the real API: RPDB answers
// HEAD with 403 and no body.
async function ensureProbe() {
  const key = rpdbKey();
  if (!key || probed) return;
  probed = true;
  try {
    const r = await kino.fetch(imageUrl(key, "imdb", posterType(), PROBE_ID), { method: "HEAD", timeoutMs: 10000 });
    if (r.status === 401 || r.status === 403) {
      keyRejected = true;
      log("El servidor de pósters rechazó la clave (" + r.status + "): se usan los pósters de TMDB");
    }
  } catch (e) {
    log("no pude comprobar la clave del servidor de pósters: " + (e && e.message ? e.message : e));
  }
}

// The poster server only when it is asked for, a key is set, and that key was not rejected.
function usesServer() {
  return setting("posterSource", "rpdb") === "rpdb" && rpdbKey() !== "" && !keyRejected;
}

// RPDB takes the media type INSIDE the id value for TMDB lookups: `movie-603`, `series-1399`.
//
// Without it, a bare number makes RPDB guess between TMDB's film and series namespaces. Those are two
// separate id lists that collide, and RPDB picks by popularity: a very popular title wins the guess,
// and everything else is served another title's poster or none at all. That is what produced a 1930s
// German film poster on a series card and empty cards on other series. IMDb ids need none of this:
// `tt0944947` names one title unambiguously, so `meta()` leaves them alone.
function tmdbIdValue(mediaType, id) {
  const value = String(id);
  if (setting("idMode", "typed") === "plain") return value;
  return (mediaType === "tv" || mediaType === "series" ? "series-" : "movie-") + value;
}

// The poster (or backdrop) of one TMDB result.
//
// TMDB picks the image path for the language it was asked for and only then falls back to the
// original language, then to the best rated one: that fallback is documented but does not always
// happen, and `es-MX` is looked up as plain `es` because TMDB does not support regional variants for
// images. So a result can arrive with no image path even though artwork exists.
//
// RPDB is therefore asked for the poster even when this response carries no path: RPDB looks the
// artwork up on TMDB and Fanart.tv itself, and its own `fallback` decides what to serve when it has
// no rated variant. Only when RPDB is not in play does the missing path mean there is nothing to show.
function art(m, kind, mediaType) {
  const path = kind === "poster" ? m.poster_path : m.backdrop_path;
  if (usesServer() && (kind === "poster" || setting("withBackdrop", false) === true)) {
    return imageUrl(rpdbKey(), "tmdb", kind === "poster" ? posterType() : DEFAULT_BACKDROP, tmdbIdValue(mediaType, m.id));
  }
  if (!path) return undefined;
  return (kind === "poster" ? TMDB_POSTER : TMDB_BACKDROP) + path;
}

// TMDB is asked through Kino, which puts its own key and its own cache in front: the plugin carries
// no key and does not declare api.themoviedb.org for it. The kino.fetch path is the fallback for
// Kino 0.9.52 and older, and then the key is the person's.
async function tmdb(path, params) {
  const full = Object.assign({ language: tmdbLang() }, params || {});
  if (typeof kino.tmdb === "function") return kino.tmdb(path, full);
  const key = String(setting("tmdbKey", "")).trim();
  if (!key) throw kino.error("auth_required", "falta la llave de TMDB");
  const r = await kino.fetch("https://api.themoviedb.org/3" + path + "?" + new URLSearchParams(Object.assign({}, full, { api_key: key })));
  if (!r.ok) throw kino.error(r.status === 404 ? "not_found" : "unavailable", "TMDB respondió " + r.status);
  return r.json();
}

function results(data) {
  return data && Array.isArray(data.results) ? data.results : [];
}

function item(m, kind) {
  const isTv = kind === "tv";
  const title = String((isTv ? m.name : m.title) || m.original_title || m.original_name || "").slice(0, 200);
  if (!title) return null;
  const date = String((isTv ? m.first_air_date : m.release_date) || "");
  const out = {
    // `id` is the identity the person's library and progress hang off: it has to be stable.
    id: (isTv ? "tv-" : "mv-") + m.id,
    ref: JSON.stringify({ path: isTv ? "/tv/" + m.id : "/movie/" + m.id, kind, id: m.id, list: true }),
    kind: isTv ? "series" : "movie",
    title,
    // ids.tmdb is what lets Kino match this title with the person's other sources.
    ids: { tmdb: m.id },
  };
  if (/^\d{4}/.test(date)) out.year = date.slice(0, 4);
  // Worth a line in the log: it is the case where TMDB returned no image path, so if RPDB also has
  // nothing for this title the card stays empty and this line says which title it was.
  if (!m.poster_path && usesServer()) log("TMDB no trajo imagen para «" + title + "»: se le pide al servidor de pósters igual");
  const poster = art(m, "poster", kind);
  if (poster) out.poster = poster;
  const backdrop = art(m, "backdrop", kind);
  if (backdrop) out.backdrop = backdrop;
  if (m.overview) out.overview = String(m.overview).slice(0, 2000);
  if (typeof m.vote_average === "number" && m.vote_average > 0) out.rating = m.vote_average;
  return out;
}

// A ref is opaque to Kino and may come back from the person's library long after it was handed out,
// so it is parsed once and each caller takes only what it needs.
function parseRef(ref) {
  if (typeof ref !== "string" || ref === "" || ref.length > 2048) return null;
  let spec;
  try {
    spec = JSON.parse(ref);
  } catch {
    return null;
  }
  return spec && typeof spec === "object" ? spec : null;
}

// browse() only ever asks TMDB for a list path; anything else is refused before it leaves.
function listRef(spec) {
  if (!spec || typeof spec.path !== "string" || !PATH_RULE.test(spec.path) || spec.path.indexOf("..") !== -1) return null;
  if (spec.kind !== "movie" && spec.kind !== "tv") return null;
  return { path: spec.path, kind: spec.kind };
}

// episodes() needs the show's TMDB id, not the path it was listed through.
function showRef(spec) {
  if (!spec || spec.kind !== "tv") return null;
  const id = Number(spec.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function nextCursor(data, page) {
  const total = Number(data && data.total_pages) || page;
  return page < Math.min(total, TMDB_PAGE_CAP) ? String(page + 1) : undefined;
}

export async function home() {
  try {
    await ensureProbe();
    const pages = await Promise.all(ROWS.map((row) => tmdb(row.path)));
    const rows = [];
    ROWS.forEach((row, i) => {
      const items = results(pages[i]).map((m) => item(m, row.kind)).filter(Boolean);
      if (!items.length) return;
      rows.push({
        id: row.id,
        title: t(row.title),
        items,
        // A row with a ref and a browse() gets the "Ver más" card.
        ref: JSON.stringify({ path: row.path, kind: row.kind, list: true }),
        genre: row.genre,
      });
    });
    return rows;
  } catch (e) {
    // A Kino with no key of its own and a person with none either: no rows instead of an error.
    if (e && e.code === "no_tmdb_key") {
      log("TMDB sin llave disponible: el Inicio no aporta filas");
      return [];
    }
    throw e;
  }
}

export async function browse(ref, cursor) {
  const spec = listRef(parseRef(ref));
  if (!spec) return { items: [] };
  await ensureProbe();
  const page = Math.max(1, parseInt(cursor, 10) || 1);
  const data = await tmdb(spec.path, { page });
  const items = results(data).map((m) => item(m, spec.kind)).filter(Boolean);
  const next = nextCursor(data, page);
  return next ? { items, next } : { items };
}

export async function search(query) {
  const q = query && query.q ? String(query.q).trim() : "";
  if (!q) return [];
  await ensureProbe();
  const page = Math.max(1, parseInt(query && query.cursor, 10) || 1);
  const data = await tmdb("/search/multi", { query: q, include_adult: false, page });
  const items = results(data)
    .filter((m) => m.media_type === "movie" || m.media_type === "tv")
    .map((m) => item(m, m.media_type))
    .filter(Boolean);
  const next = nextCursor(data, page);
  return next ? { items, next } : items;
}

export async function episodes(ref) {
  const id = showRef(parseRef(ref));
  if (!id) return { episodes: [] };
  const path = "/tv/" + id;
  const show = await tmdb(path);
  const seasons = (Array.isArray(show.seasons) ? show.seasons : [])
    .filter((s) => Number(s.season_number) > 0)
    .slice(0, 10);
  const loaded = await Promise.all(
    seasons.map((s) => tmdb(path + "/season/" + s.season_number).catch(() => null))
  );
  const episodes = [];
  for (const season of loaded) {
    if (!season || !Array.isArray(season.episodes)) continue;
    for (const e of season.episodes) {
      const number = Number(e.episode_number);
      if (!(number > 0)) continue;
      const episode = {
        season: Number(e.season_number) > 0 ? Number(e.season_number) : 1,
        number,
        ref: JSON.stringify({ kind: "tv", id, s: e.season_number, e: number }),
      };
      if (e.name) episode.title = String(e.name).slice(0, 200);
      if (e.overview) episode.overview = String(e.overview).slice(0, 2000);
      if (e.still_path) episode.still = TMDB_STILL + e.still_path;
      if (typeof e.air_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.air_date)) episode.airDate = e.air_date;
      if (typeof e.runtime === "number" && e.runtime >= 1 && e.runtime <= 1000) episode.runtimeMinutes = e.runtime;
      episodes.push(episode);
    }
  }
  const series = { title: String(show.name || "").slice(0, 200) || undefined };
  const poster = art(show, "poster", "tv");
  if (poster) series.poster = poster;
  if (show.overview) series.overview = String(show.overview).slice(0, 2000);
  return { series, episodes };
}

// The bonus a catalogue can give: filling a missing poster on a title that came from ANOTHER source.
// Kino merges meta last, so this only ever fills a gap; it never replaces what a source gave.
export async function meta(query) {
  const key = rpdbKey();
  if (!key || setting("posterSource", "rpdb") !== "rpdb") return null;
  const picked = pickId(query && query.ids);
  if (!picked) return null;
  await ensureProbe();
  if (keyRejected) return null;
  // A bare TMDB id would make RPDB guess between films and series; `query.type` says which it is.
  const idValue = picked.idType === "tmdb" ? tmdbIdValue(query && query.type, picked.id) : picked.id;
  const answer = { poster: imageUrl(key, picked.idType, posterType(), idValue) };
  if (setting("withBackdrop", false) === true) {
    answer.backdrop = imageUrl(key, picked.idType, DEFAULT_BACKDROP, idValue);
  }
  return answer;
}

// IMDb first: it names a film and a series without RPDB having to guess which namespace a bare TMDB
// id belongs to.
function pickId(ids) {
  if (!ids) return null;
  for (const idType of ["imdb", "tmdb"]) {
    const raw = ids[idType];
    if (raw === undefined || raw === null || raw === "") continue;
    const id = String(raw).trim();
    if (ID_RULES[idType].test(id)) return { idType, id };
  }
  return null;
}

// `catalogOnly` says this plugin plays nothing, but a manifest still has to declare `resolve` and one
// of `search`/`home` for Kino 0.9.53 and older, which do not know that field yet.
export async function resolve(ref) {
  // apiVersion 6 means Kino 0.9.50 or newer, where a throw before the first await is caught normally.
  throw kino.error("not_found", "catalog only", { userMessage: t("noSource") });
}
