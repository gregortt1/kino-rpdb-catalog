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
// Rated posters come from RPDB; backdrops always come from TMDB, because rated backdrops are one of
// RPDB's paid tiers and asking for one a free key cannot serve empties every card on a television.
//
// catalogOnly: the plugin lists and describes titles but plays none, so Kino 0.9.54+ sends its titles
// to "Buscar dónde verlo", where the person's other sources find them.

const TMDB_POSTER = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w780";
const TMDB_STILL = "https://image.tmdb.org/t/p/w300";
// The two servers this plugin knows, both declared in `hosts`. The person picks one from a list instead
// of typing an address: a mistyped address was a whole class of support question, and Kino lists every
// declared host in the consent sheet either way.
const RPDB = "https://api.ratingposterdb.com";
const SERVERS = {
  rpdb: RPDB,
  openposterdb: "https://openposterdb.com",
};
const PROBE_ID = "tt0133093";                 // The Matrix: an id RPDB has always known
const STILL_PROBE = { id: 1399, season: 1, episode: 1 };   // Game of Thrones, S1E1
const DEFAULT_POSTER = "poster-default";
const DEFAULT_BACKDROP = "backdrop-default";
// The free public key of OpenPosterDB: it is the manifest's default, and validateSettings refuses to save
// it together with RatingPosterDB. Keep the two in step.
const FREE_KEY = "t0-free-rpdb";
const ID_RULES = { imdb: /^tt\d{5,10}$/, tmdb: /^[1-9]\d{0,9}$/ };
const TYPE_RULE = /^[a-z][a-z0-9-]{2,40}$/;
const PATH_RULE = /^\/[A-Za-z0-9/_-]{0,120}$/;
const TMDB_PAGE_CAP = 500;

const TEXT = {
  es: {
    trendMovies: "Pel\u00edculas en tendencia",
    trendShows: "Series en tendencia",
    topMovies: "Pel\u00edculas mejor valoradas",
    topShows: "Series mejor valoradas",
    inCinemas: "En cines",
    onAir: "Series al aire",
    upcoming: "Pr\u00f3ximos estrenos",
    popularShows: "Series populares",
    anime: "Anime",
    documentaries: "Documentales",
    kids: "Infantil",
    doramas: "Doramas",
    movies: "Pel\u00edculas",
    shows: "Series",
    popMovies: "Pel\u00edculas populares",
    popShows: "Series populares",
    todayMovies: "Pel\u00edculas en tendencia hoy",
    todayShows: "Series en tendencia hoy",
    action: "Acci\u00f3n",
    comedy: "Comedia",
    horror: "Terror",
    scifi: "Ciencia ficci\u00f3n",
    animation: "Animaci\u00f3n",
    today: "Tendencias de hoy",
    popular: "Populares",
    topRated: "Mejor valoradas",
    genres: "G\u00e9neros",
    noSource: "Este cat\u00e1logo no reproduce t\u00edtulos: busca d\u00f3nde verlo en tus otras fuentes.",
  },
  en: {
    trendMovies: "Trending movies",
    trendShows: "Trending shows",
    topMovies: "Top rated movies",
    topShows: "Top rated shows",
    inCinemas: "In cinemas",
    onAir: "On the air",
    upcoming: "Coming soon",
    popularShows: "Popular shows",
    anime: "Anime",
    documentaries: "Documentaries",
    kids: "Kids",
    doramas: "Doramas",
    movies: "Movies",
    shows: "Shows",
    popMovies: "Popular movies",
    popShows: "Popular shows",
    todayMovies: "Trending movies today",
    todayShows: "Trending shows today",
    action: "Action",
    comedy: "Comedy",
    horror: "Horror",
    scifi: "Science fiction",
    animation: "Animation",
    today: "Trending today",
    popular: "Popular",
    topRated: "Top rated",
    genres: "Genres",
    noSource: "This catalogue plays nothing: use it to find the title in your other sources.",
  },
};

// TMDB genre ids: 16 is Animation (for series and for films alike) and 99 is Documentary. The language
// filter is what makes Anime actually anime: Animation on its own also brings every western cartoon.
// `/discover` takes these as query parameters, so each row carries them and its "Ver más" keeps them.
const ANIME_PARAMS = { with_genres: 16, with_original_language: "ja", sort_by: "popularity.desc" };
const DOCS_PARAMS = { with_genres: 99, sort_by: "popularity.desc" };
// 16 + 10751 with a comma is TMDB's AND: animation AND family, which is what "Infantil" means.
const KIDS_PARAMS = { with_genres: "16,10751", sort_by: "popularity.desc" };
const DORAMA_PARAMS = { with_genres: 18, with_original_language: "ko", sort_by: "popularity.desc" };

// What each Home row asks TMDB for.
//
// THE ORDER MATTERS. In the "Home por categorías" the TYPE of a title (anime, infantil, documentales,
// doramas…) is decided by the first row it appears in, so the themed rows go first: an anime that is also
// trending would otherwise be typed as a plain movie and never reach the Anime row. In the classic Home
// that only changes the order of the rows.
const ROWS = [
  { id: "rpdb-anime", path: "/discover/tv", params: ANIME_PARAMS, kind: "tv", genre: "anime", title: "anime" },
  { id: "rpdb-docs", path: "/discover/movie", params: DOCS_PARAMS, kind: "movie", genre: "documentales", title: "documentaries" },
  { id: "rpdb-kids", path: "/discover/movie", params: KIDS_PARAMS, kind: "movie", genre: "infantil", title: "kids" },
  { id: "rpdb-doramas", path: "/discover/tv", params: DORAMA_PARAMS, kind: "tv", genre: "doramas", title: "doramas" },
  { id: "rpdb-trend-movies", path: "/trending/movie/week", kind: "movie", genre: "peliculas", title: "trendMovies" },
  { id: "rpdb-trend-shows", path: "/trending/tv/week", kind: "tv", genre: "series", title: "trendShows" },
  { id: "rpdb-top-movies", path: "/movie/top_rated", kind: "movie", genre: "peliculas", title: "topMovies" },
  { id: "rpdb-top-shows", path: "/tv/top_rated", kind: "tv", genre: "series", title: "topShows" },
  { id: "rpdb-cinema", path: "/movie/now_playing", kind: "movie", genre: "peliculas", title: "inCinemas" },
  { id: "rpdb-on-air", path: "/tv/on_the_air", kind: "tv", genre: "series", title: "onAir" },
  { id: "rpdb-upcoming", path: "/movie/upcoming", kind: "movie", genre: "peliculas", title: "upcoming" },
];

// The plugin's own section: six tabs, each with its own rows. Same shape as a Home row, so the same
// builder is used for both.
//
// Two of them split by what the title IS (Películas, Series) and four by what the list IS (Tendencias de
// hoy, Populares, Mejor valoradas, Géneros). Kino's Home only shows the ten fixed category chips
// (`peliculas`, `series`, `anime`…), so "Populares" or "Mejor valoradas" can never be a chip there: this
// is the place for them, and Kino allows up to 8 tabs.
const SECTION_TABS = [
  { id: "pelis", label: "movies" },
  { id: "series", label: "shows" },
  { id: "hoy", label: "today" },
  { id: "populares", label: "popular" },
  { id: "mejor", label: "topRated" },
  { id: "generos", label: "genres" },
];

// The genre rows of the last tab. TMDB film genre ids: 28 Action, 35 Comedy, 27 Horror, 878 Science
// Fiction, 16 Animation, 99 Documentary.
const GENRE_ROWS = [
  { id: "sec-gen-action", params: { with_genres: 28, sort_by: "popularity.desc" }, title: "action" },
  { id: "sec-gen-comedy", params: { with_genres: 35, sort_by: "popularity.desc" }, title: "comedy" },
  { id: "sec-gen-horror", params: { with_genres: 27, sort_by: "popularity.desc" }, title: "horror" },
  { id: "sec-gen-scifi", params: { with_genres: 878, sort_by: "popularity.desc" }, title: "scifi" },
  { id: "sec-gen-animation", params: { with_genres: 16, sort_by: "popularity.desc" }, title: "animation" },
  { id: "sec-gen-docs", params: DOCS_PARAMS, title: "documentaries" },
].map((row) => Object.assign({ path: "/discover/movie", kind: "movie", genre: "peliculas" }, row));

const SECTION_ROWS = {
  pelis: [
    { id: "sec-movies-trend", path: "/trending/movie/week", kind: "movie", genre: "peliculas", title: "trendMovies" },
    { id: "sec-movies-cinema", path: "/movie/now_playing", kind: "movie", genre: "peliculas", title: "inCinemas" },
    { id: "sec-movies-soon", path: "/movie/upcoming", kind: "movie", genre: "peliculas", title: "upcoming" },
    { id: "sec-movies-docs", path: "/discover/movie", params: DOCS_PARAMS, kind: "movie", genre: "documentales", title: "documentaries" },
    { id: "sec-movies-kids", path: "/discover/movie", params: KIDS_PARAMS, kind: "movie", genre: "infantil", title: "kids" },
    { id: "sec-movies-top", path: "/movie/top_rated", kind: "movie", genre: "peliculas", title: "topMovies" },
  ],
  series: [
    { id: "sec-shows-trend", path: "/trending/tv/week", kind: "tv", genre: "series", title: "trendShows" },
    { id: "sec-shows-air", path: "/tv/on_the_air", kind: "tv", genre: "series", title: "onAir" },
    { id: "sec-shows-anime", path: "/discover/tv", params: ANIME_PARAMS, kind: "tv", genre: "anime", title: "anime" },
    { id: "sec-shows-doramas", path: "/discover/tv", params: DORAMA_PARAMS, kind: "tv", genre: "doramas", title: "doramas" },
    { id: "sec-shows-pop", path: "/tv/popular", kind: "tv", genre: "series", title: "popularShows" },
    { id: "sec-shows-top", path: "/tv/top_rated", kind: "tv", genre: "series", title: "topShows" },
  ],
  hoy: [
    { id: "sec-today-movies", path: "/trending/movie/day", kind: "movie", genre: "peliculas", title: "todayMovies" },
    { id: "sec-today-shows", path: "/trending/tv/day", kind: "tv", genre: "series", title: "todayShows" },
  ],
  populares: [
    { id: "sec-pop-movies", path: "/movie/popular", kind: "movie", genre: "peliculas", title: "popMovies" },
    { id: "sec-pop-shows", path: "/tv/popular", kind: "tv", genre: "series", title: "popShows" },
    { id: "sec-pop-air", path: "/tv/on_the_air", kind: "tv", genre: "series", title: "onAir" },
  ],
  mejor: [
    { id: "sec-top-movies", path: "/movie/top_rated", kind: "movie", genre: "peliculas", title: "topMovies" },
    { id: "sec-top-shows", path: "/tv/top_rated", kind: "tv", genre: "series", title: "topShows" },
  ],
  generos: GENRE_ROWS,
};

// The tiles of Kino's Categorías tab. TMDB's genre ids are stable and well known; the ones used here are
// the film and series variants of the same handful of genres. Each tile is a `/discover` list, so the
// tile's ref has to carry its parameters through browse().
const GENRE_TILES = [
  { id: "accion", label: "Acci\u00f3n", kind: "movie", genre: 28 },
  { id: "accion-series", label: "Acci\u00f3n y aventura", kind: "tv", genre: 10759 },
  { id: "comedia", label: "Comedia", kind: "movie", genre: 35 },
  { id: "comedia-series", label: "Comedia (series)", kind: "tv", genre: 35 },
  { id: "drama", label: "Drama", kind: "movie", genre: 18 },
  { id: "drama-series", label: "Drama (series)", kind: "tv", genre: 18 },
  { id: "terror", label: "Terror", kind: "movie", genre: 27 },
  { id: "misterio-series", label: "Misterio (series)", kind: "tv", genre: 9648 },
  { id: "ciencia-ficcion", label: "Ciencia ficci\u00f3n", kind: "movie", genre: 878 },
  { id: "fantasia-series", label: "Ciencia ficci\u00f3n y fantas\u00eda", kind: "tv", genre: 10765 },
  { id: "animacion", label: "Animaci\u00f3n", kind: "movie", genre: 16 },
  { id: "documental", label: "Documentales", kind: "movie", genre: 99 },
];

// The tiles that are not a genre but a KIND of list. In the Inicio they cannot be category chips — Kino
// only knows ten fixed ones — so this is where "Tendencias de hoy", "Más populares" and "Mejor valoradas"
// can live as something the person browses. `path` + `params`, and the artwork comes from the first title.
const LIST_TILES = [
  { id: "lista-hoy", label: "Tendencias de hoy", kind: "movie", path: "/trending/movie/day" },
  { id: "lista-populares", label: "M\u00e1s populares", kind: "movie", path: "/movie/popular" },
  { id: "lista-mejor", label: "Mejor valoradas", kind: "movie", path: "/movie/top_rated" },
  { id: "lista-anime", label: "Anime", kind: "tv", path: "/discover/tv", params: ANIME_PARAMS },
  { id: "lista-docs", label: "Documentales", kind: "movie", path: "/discover/movie", params: DOCS_PARAMS },
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

// Kino hands a `toggle` back as a real boolean, but a value can arrive from anywhere: only an explicit
// true (or the text "true") turns something on. Anything else — including a missing setting — is off.
function isOn(name) {
  const value = setting(name, false);
  return value === true || value === "true";
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

// The server that draws the rated images, chosen from a list: RatingPosterDB or the free hosted
// OpenPosterDB. Both are declared in `hosts`, so no `url` setting is needed to make either reachable.
function posterServer() {
  const chosen = String(setting("service", "openposterdb")).trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(SERVERS, chosen) ? SERVERS[chosen] : SERVERS.openposterdb;
}

// Whether the server is RatingPosterDB, which decides if the server-specific tuning applies at all.
function usesRpdb() {
  return posterServer() === RPDB;
}

// The tuning parameters below are the free server's, and they are for a TELEVISION only.
//
// Why only there: the settings of a plugin are the same on every device of the person's account, so a
// phone would inherit whatever is chosen for the television. A phone shows the poster big and the cards
// narrow, so it does not want the same thing. `kino.device` is exactly for this, and anything that is
// not "tv" is treated as a phone (it is undefined before Kino 0.9.55).
//
// Why only with a custom server: they are measured to work on the free one, and RPDB gets the plain URL
// that is known to work, so an unknown parameter cannot break every image.
//
// The badge sizes were measured at television card width (~470 px), where the default `m` came out as an
// unreadable strip of five or six stacked badges.
const QUALITY = {
  normal: { badge: "m", size: "" },
  sharp: { badge: "l", size: "" },
  max: { badge: "xl", size: "large" },
};

// Every key the free server knows. `ratings_exclude` is the only parameter that really restricts the
// source: `ratings_order` only sorts, and it falls through to another source (measured on Lanterns,
// where IMDb has a rating for episode 1 only). A key here that the server does NOT know makes it answer
// 400 and the whole image is lost, which is why the list is probed before it is used.
const RATING_KEYS = ["mal", "lb", "rt", "mc", "rta", "tmdb", "trakt", "mdblist", "ebert"];

// Which notes the person wants, and how many that is. `keys` is what is kept and the rest is excluded;
// null means "do not restrict, take what the server has" (its own priority order, which starts with
// MyAnimeList and Letterboxd — fine for anime, odd for everything else).
const RATINGS = {
  imdb: { order: "imdb", keys: ["imdb"], count: 1 },
  imdbfallback: { order: "imdb,tmdb", keys: ["imdb", "tmdb"], count: 1 },
  imdbrt: { order: "imdb,rt", keys: ["imdb", "rt"], count: 2 },
  imdbrtmc: { order: "imdb,rt,mc", keys: ["imdb", "rt", "mc"], count: 3 },
  // IMDb y RT, más MyAnimeList cuando la tiene. El orden pone `mal` primero a propósito: MyAnimeList
  // solo puntúa anime, así que en una película no existe y el servidor pasa directo a IMDb. Se deja fuera
  // Letterboxd, que puntúa sobre 5 y quedaba mezclado con notas sobre 10 y porcentajes.
  imdbrtmal: { order: "mal,imdb,rt,mc", keys: ["mal", "imdb", "rt", "mc"], count: 3 },
  // "Todas las que haya", solo para fondos: medido contra el servicio, un fondo de 1920 px encaja ocho
  // notas en una fila sin solaparse (a partir de ahí el servidor no da más). En un póster no se ofrece
  // porque ocho notas verticales se envuelven y tapan el título: ahí el máximo legible es tres.
  all: { order: "", keys: null, count: 8 },
  auto: { order: "", keys: null, count: 3 },
};

// The settings are split in two: one group for the poster and one for the backdrop. A poster is vertical
// and a backdrop is 16:9, so what fits in one does not fit in the other — one setting for both meant
// choosing notes for the poster and getting them on the backdrop too. The episode stills are 16:9 like a
// backdrop, so they follow the backdrop's group (their position is fixed separately).
function groupOf(kind) {
  return kind === "poster" ? "poster" : "backdrop";
}

function groupSetting(kind, name, fallback) {
  return setting(groupOf(kind) + name, fallback);
}

function ratingsMode(kind) {
  const stored = String(groupSetting(kind, "Ratings", "imdbRtMc")).trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(RATINGS, stored) ? stored : "imdbrtmc";
}

// A poster is vertical and narrow: with three badges at the large sizes the server wraps them onto a
// second line, right over the poster's own title. Measured against the live service at poster width,
// three badges fit in ONE row only at "m"; two fit at "l" and at "xl"; one fits at any size. So the
// chosen size is kept except for three badges on a poster, where it drops to "m" to stay on one line.
// A backdrop is wide and needs no such care.
function badgeSize(kind, chosen) {
  if (kind === "poster" && RATINGS[ratingsMode(kind)].count >= 3 && (chosen === "l" || chosen === "xl")) return "m";
  return chosen;
}

let tuningOff = false;

// Where the badge sits on the image. The server takes eight anchors; measured on the live service, all
// eight give a different image, and NOT asking for one leaves backdrops at the top-right CORNER — which
// is what it did until now, reported as ugly on a phone, where the corner is against the screen edge.
//
// Two things changed with that report:
//   - The default is `r`, centred on the right, instead of "let the server decide" (which means the top
//     right corner).
//   - The position is sent on EVERY device, not only on a television. It is a property of the IMAGE, not
//     of the screen: the backdrop is the same 16:9 picture everywhere. The badge SIZE still belongs to
//     the television, because that depends on how small the card is drawn.
//
// A poster and an episode still keep a fixed position: a poster is vertical with its badge at the bottom,
// and a still is 16:9 with it top-right.
const POSITIONS = ["bc", "tc", "l", "r", "tl", "tr", "bl", "br"];
const FIXED_POSITION = { poster: "bc", still: "tr" };
const DEFAULT_POSITION = "r";

function badgePosition() {
  const stored = String(setting("backdropPosition", DEFAULT_POSITION)).trim().toLowerCase();
  return POSITIONS.indexOf(stored) === -1 ? DEFAULT_POSITION : stored;
}

function positionFor(kind) {
  if (kind === "backdrop") return badgePosition();
  return FIXED_POSITION[kind] || "";
}

function quality(kind) {
  const value = String(groupSetting(kind, "BadgeSize", "sharp")).trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(QUALITY, value) ? value : "sharp";
}

function isTv() {
  return kino.device === "tv";
}

// The tuning is split in two groups, and the split is deliberate:
//
//   - TELEVISION ONLY (`tuningWanted`): the size, the position and which notes. A television draws its
//     cards wide and its badges shrink to ~470 px, so these are choices about THAT shape; the person asked
//     for them not to change the phone.
//   - EVERY DEVICE: the language of the artwork and "no title on the poster". Neither depends on the
//     shape of a card, and both are things the person wants everywhere: English posters on the phone were
//     a bug report, and a toggle that does nothing on the phone is worse than no toggle.
//
// Both groups are only sent to the free server: RPDB has its own language handling and its own types.
function tuningWanted() {
  return isTv() && !usesRpdb();
}

function globalTuningWanted() {
  return !usesRpdb();
}

// `mode`: "none" for a URL that only tests the server (no tuning at all), "force" for the probe of the
// tuning itself, and "auto" for the real images. `kind` is which of the three images this is: the poster
// and the backdrop each have their own settings, and only the backdrop's position is the person's to pick.
function tuningQuery(mode, kind) {
  // fallback=true asks RPDB for the plain image when it cannot build the rated one. On the free server
  // it is accepted and ignored: it falls back to TMDB artwork instead of a 1x1 pixel placeholder.
  if (mode === "none") return "?fallback=true";
  const parts = [];

  if (globalTuningWanted()) {
    // The artwork's language, on the poster only (measured: on a backdrop or a still, `lang` returns the
    // very same file). Without it the server serves English — that was the bug report. Measured too that
    // an unknown language answers 200 and not 400, so it needs no probe.
    if (kind === "poster") parts.push("lang=" + tmdbLang());
    // The textless artwork. It matters because the badge row sits at the bottom, right where the poster
    // prints its own title: without the text, the notes stop fighting with it. Verified against the live
    // service (a documented boolean): when there is no textless version it serves the normal one.
    if (kind === "poster" && isOn("posterTextless")) parts.push("textless=true");
    // Where the badge sits. Every device: the image is the same 16:9 picture on a phone and on a
    // television, so a corner that is against the screen edge is ugly in both.
    const position = positionFor(kind);
    if (position) parts.push("position=" + position);
  }

  // From here on, only a television, and only while the server accepts the tuning.
  if (!tuningWanted() || (mode !== "force" && tuningOff)) {
    parts.push("fallback=true");
    return "?" + parts.join("&");
  }

  const q = QUALITY[quality(kind)];
  parts.push("badge_size=" + badgeSize(kind, q.badge));
  // imageSize only means something on a wide image; a poster is not scaled by it.
  if (q.size && kind !== "poster") parts.push("imageSize=" + q.size);
  // Which notes, and how many. `ratings_order` alone only sorts and falls through to another source
  // (measured on Lanterns, where IMDb has a rating for episode 1 only), so the sources that are not
  // wanted are excluded outright — except in "automático", where the server picks.
  const spec = RATINGS[ratingsMode(kind)];
  if (spec.keys) {
    const exclude = RATING_KEYS.filter((k) => spec.keys.indexOf(k) === -1);
    parts.push("ratings_order=" + spec.order, "ratings_limit=" + spec.count);
    if (exclude.length) parts.push("ratings_exclude=" + exclude.join(","));
  } else {
    parts.push("ratings_limit=" + spec.count);
  }
  parts.push("fallback=true");
  return "?" + parts.join("&");
}

function artUrl(key, idType, type, id, mode, kind) {
  return posterServer() + "/" + encodeURIComponent(key) + "/" + idType + "/" + type + "/" + encodeURIComponent(id) + ".jpg" + tuningQuery(mode, kind);
}

function imageUrl(key, idType, type, id, kind) {
  return artUrl(key, idType, type, id, "auto", kind);
}

// Episode stills use their own documented id shape: `episode-{series id}-S{season}E{episode}`.
function stillUrl(key, seriesId, season, episode) {
  const id = "episode-" + encodeURIComponent(seriesId) + "-S" + season + "E" + episode;
  return artUrl(key, "tmdb", "episode-default", id, "auto", "still");
}

let probed = false;
let keyRejected = false;
// Set by the probes below and read synchronously by art()/episodes(). They fail CLOSED: only a confirmed
// 2xx turns a rated kind on. Asking a key for an image it cannot serve is what emptied every card on a
// television, where Kino draws its cards with the backdrop.
let backdropsOn = false;
let stillsOn = false;
const probedKinds = {};

// One probe per runtime, for the key itself. Only a definite 401/403 is a verdict: a 404, a 5xx, a
// timeout or a HEAD the server does not answer say nothing about the key, and the answers go out anyway.
// Checked against the real API: RPDB answers HEAD with 403 and no body.
//
// The settings form calls the same probes with a shorter patience, because Kino gives it 10 s in total.
async function ensureProbe(timeoutMs) {
  const key = rpdbKey();
  if (!key || probed) return;
  probed = true;
  try {
    const r = await kino.fetch(artUrl(key, "imdb", posterType(), PROBE_ID, "none", "poster"), { method: "HEAD", timeoutMs: timeoutMs || 10000 });
    if (r.status === 401 || r.status === 403) {
      keyRejected = true;
      log("El servidor rechaz\u00f3 la clave (" + r.status + "): se usan las im\u00e1genes de TMDB");
    }
  } catch (e) {
    log("no pude comprobar la clave del servidor: " + (e && e.message ? e.message : e));
  }
}

function serverReady() {
  return rpdbKey() !== "" && !keyRejected;
}

// --- Lo que se recuerda entre sesiones ---------------------------------------------------------------
//
// Kino cierra el sandbox del plugin a menudo: tras cinco minutos sin usarlo, tras cualquier tiempo
// agotado, al cambiar un ajuste y al actualizar el plugin. La memoria normal se va con él, así que las
// tres comprobaciones de capacidad se repetían antes de la primera imagen de cada sesión.
//
// El almacén del plugin sí sobrevive. Guardar un "sí" reciente tiene un premio que no es la velocidad:
// las comprobaciones fallan en cerrado, y eso es correcto, pero significa que UN tiempo agotado deja el
// servidor por inservible durante toda la sesión y la persona pierde las notas sin saber por qué. Con lo
// guardado, la pregunta deja de ser «¿funciona ahora mismo?» y pasa a ser «¿funcionaba hace poco?».
//
// Dos reglas hacen que esto no sea una forma de mentirse:
//   - SOLO se guarda lo que funcionó. Un "no" no se guarda nunca: si fue un tiempo agotado, la próxima
//     sesión vuelve a preguntar en vez de arrastrar la condena.
//   - La clave del almacén lleva el servidor y una huella de la clave, porque el almacén NO se borra al
//     cambiar los ajustes (lo avisa la documentación). Cambiar cualquiera de los dos invalida lo guardado.
//
// La comprobación de la CLAVE no se recuerda: es una sola petición, y una clave revocada dejaría imágenes
// rotas durante horas.
const STORE_PREFIX = "probes:";
const STORE_TTL_MS = 12 * 60 * 60 * 1000;   // 12 h: bien dentro del tope de 30 días

let storedRead = false;

function storeKey() {
  // Una huella no reversible basta: solo hay que notar que la clave cambió, no recuperarla.
  const key = rpdbKey();
  let huella = 0;
  for (let i = 0; i < key.length; i++) huella = (huella * 31 + key.charCodeAt(i)) >>> 0;
  return STORE_PREFIX + String(posterServer()).replace(/^https?:\/\//, "") + ":" + key.length + ":" + huella.toString(36);
}

function storeAvailable() {
  return !!kino.storage && typeof kino.storage.get === "function";
}

// Se lee una vez por runtime, y solo rellena lo que el servidor ya confirmó alguna vez.
function loadStoredVerdicts() {
  if (storedRead) return;
  storedRead = true;
  if (!storeAvailable()) return;
  let saved = null;
  try {
    saved = JSON.parse(kino.storage.get(storeKey()) || "null");
  } catch (e) {
    log("no pude leer lo comprobado antes: " + (e && e.message ? e.message : e));
    return;
  }
  if (!saved || typeof saved !== "object") return;
  if (saved.backdrop === true) { probedKinds.backdrop = true; backdropsOn = true; }
  if (saved.still === true) { probedKinds.still = true; stillsOn = true; }
  if (saved.tuning === true) { probedKinds.tuning = true; tuningOff = false; }
  log("recordaba de la sesi\u00f3n anterior: " + Object.keys(saved).filter((k) => saved[k] === true).join(", "));
}

function saveVerdict(kind) {
  if (!storeAvailable()) return;
  try {
    const raw = kino.storage.get(storeKey());
    const saved = raw ? JSON.parse(raw) : {};
    saved[kind] = true;
    kino.storage.set(storeKey(), JSON.stringify(saved), { ttlMs: STORE_TTL_MS });
  } catch (e) {
    // Un almacén lleno o ausente no puede romper una llamada: el plugin sigue igual, solo sin recordar.
    log("no pude guardar lo comprobado: " + (e && e.message ? e.message : e));
  }
}

function forgetStoredVerdicts() {
  if (!storeAvailable()) return;
  try {
    kino.storage.remove(storeKey());
  } catch (e) {
    log("no pude borrar lo guardado: " + (e && e.message ? e.message : e));
  }
}

async function probeKind(kind, url, what, blame, timeoutMs) {
  if (probedKinds[kind] !== undefined) return probedKinds[kind];
  let ok = false;
  try {
    const r = await kino.fetch(url, { method: "HEAD", timeoutMs: timeoutMs || 10000 });
    ok = r.status >= 200 && r.status < 300;
  } catch (e) {
    log("no pude comprobar " + what + ": " + (e && e.message ? e.message : e));
  }
  probedKinds[kind] = ok;
  if (ok) saveVerdict(kind);
  else log(blame || "el servidor no sirve " + what + ": esa imagen la pone TMDB");
  return ok;
}

// Forgets every verdict, so the "probar el servidor" button really tests what was just chosen. Also
// forgets what was stored: a button that answers from a twelve-hour-old note would be lying.
function resetProbes() {
  probed = false;
  keyRejected = false;
  backdropsOn = false;
  stillsOn = false;
  tuningOff = false;
  storedRead = false;
  for (const kind of Object.keys(probedKinds)) delete probedKinds[kind];
  forgetStoredVerdicts();
}

// Rated backdrops are one of RPDB's paid tiers, so this is the probe that matters: with a free key it
// fails and every backdrop falls back to TMDB, which is free and always available.
async function ensureBackdropProbe(timeoutMs) {
  if (!serverReady()) return;
  loadStoredVerdicts();
  backdropsOn = await probeKind("backdrop", artUrl(rpdbKey(), "imdb", "backdrop-default", PROBE_ID, "none", "backdrop"), "fondos con nota", null, timeoutMs);
}

// The tuning list of rating keys is the free server's. A key it does not know makes it answer 400 and
// the whole image is lost, so the tuned URL is probed once per runtime too, and a failure drops the
// tuning (leaving the plain image) instead of leaving holes everywhere.
async function ensureTuningProbe(timeoutMs) {
  if (!tuningWanted()) return;
  loadStoredVerdicts();
  if (probedKinds.tuning !== undefined) return;
  const ok = await probeKind(
    "tuning",
    artUrl(rpdbKey(), "imdb", posterType(), PROBE_ID, "force", "poster"),
    "el ajuste de las notas",
    "el servidor no acepta el ajuste de las notas: se usan las notas por defecto",
    timeoutMs
  );
  tuningOff = !ok;
}

async function ensureStillProbe(timeoutMs) {
  if (!serverReady()) return;
  loadStoredVerdicts();
  const id = "episode-" + STILL_PROBE.id + "-S" + STILL_PROBE.season + "E" + STILL_PROBE.episode;
  stillsOn = await probeKind("still", artUrl(rpdbKey(), "tmdb", "episode-default", id, "none", "still"), "fotogramas con nota", null, timeoutMs);
}

// RPDB takes the media type INSIDE the id value for TMDB lookups: `movie-603`, `series-1399`.
//
// Without it, a bare number makes RPDB guess between TMDB's film and series namespaces. Those are two
// separate id lists that collide, and RPDB picks by popularity: a very popular title wins the guess,
// and everything else is served another title's poster or none at all. That is what produced a 1930s
// German film poster on a series card and empty cards on other series. IMDb ids need none of this:
// `tt0944947` names one title unambiguously, so `meta()` leaves them alone.
function tmdbIdValue(mediaType, id) {
  return (mediaType === "tv" || mediaType === "series" ? "series-" : "movie-") + String(id);
}

// The poster (or backdrop) of one TMDB result.
//
// The rated poster comes from the server. The rated backdrop only does when the probe confirmed the key
// can serve one: it is a paid tier, and asking anyway empties every card on a television. Otherwise both
// fall back to TMDB's own images, which are free and always there.
//
// TMDB picks the image path for the language it was asked for and only then falls back to the original
// language, then to the best rated one: that fallback is documented but does not always happen, and
// `es-MX` is looked up as plain `es` because TMDB does not support regional variants for images. That is
// why the server is asked for the poster even when this response carries no path: it looks the artwork
// up on TMDB and Fanart.tv itself, and its own `fallback` decides what to serve.
function art(m, kind, mediaType) {
  if (kind === "poster" && serverReady()) {
    return imageUrl(rpdbKey(), "tmdb", posterType(), tmdbIdValue(mediaType, m.id), "poster");
  }
  if (kind === "backdrop" && backdropsOn) {
    return imageUrl(rpdbKey(), "tmdb", DEFAULT_BACKDROP, tmdbIdValue(mediaType, m.id), "backdrop");
  }
  const path = kind === "poster" ? m.poster_path : m.backdrop_path;
  if (!path) return undefined;
  return (kind === "poster" ? TMDB_POSTER : TMDB_BACKDROP) + path;
}

// TMDB is asked through Kino, which puts its own key and its own cache in front: the plugin carries no
// key of its own and does not declare api.themoviedb.org. Older Kino has no such door, and this plugin
// has nothing to offer it.
async function tmdb(path, params) {
  if (typeof kino.tmdb !== "function") throw kino.error("unavailable", "este Kino no tiene kino.tmdb");
  return kino.tmdb(path, Object.assign({ language: tmdbLang() }, params || {}));
}

function results(data) {
  return data && Array.isArray(data.results) ? data.results : [];
}

// TMDB genre ids -> the ids of Kino's own vocabulary ("Home por categorías"). Kino builds that Home out
// of the `genres` of each ITEM: a title with genres shows up in the Acción / Comedia / Drama rows, and one
// without them only in the generic "Películas" row. So this map is what puts our catalogue in the genre
// rows at all. A few TMDB ids map to the same Kino id (Action & Adventure is `accion`, Soap is `drama`)
// and the result is deduplicated; anything missing here is simply ignored by Kino.
//
// The ids of TYPE (anime, documentales, infantil…) are NOT here on purpose: Kino ignores a type in
// `genres`, and a title takes its type from the `genre` of the row it first appears in.
const KINO_GENRE_BY_TMDB = {
  28: "accion", 12: "aventura", 16: "animacion", 35: "comedia", 80: "crimen",
  18: "drama", 10751: "familia", 14: "fantasia", 36: "historia", 27: "terror",
  10402: "musical", 9648: "misterio", 10749: "romance", 878: "ciencia-ficcion",
  53: "suspenso", 10752: "belica", 37: "western", 10759: "accion",
  10765: "ciencia-ficcion", 10764: "reality", 10766: "drama", 10767: "entretenimiento", 10768: "belica",
};

function genresOf(m) {
  const ids = m && Array.isArray(m.genre_ids) ? m.genre_ids : [];
  const out = [];
  for (const id of ids) {
    const kino = KINO_GENRE_BY_TMDB[Number(id)];
    // Kino admits at most five, and the same Kino genre can arrive from two TMDB ids.
    if (kino && out.indexOf(kino) === -1 && out.length < 5) out.push(kino);
  }
  return out;
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
  const genres = genresOf(m);
  if (genres.length) out.genres = genres;
  // Worth a line in the log: it is the case where TMDB returned no image path, so if RPDB also has
  // nothing for this title the card stays empty and this line says which title it was.
  if (!m.poster_path && serverReady()) log("TMDB no trajo imagen para \u00ab" + title + "\u00bb: se le pide a RPDB igual");
  const poster = art(m, "poster", kind);
  if (poster) out.poster = poster;
  const backdrop = art(m, "backdrop", kind);
  if (backdrop) out.backdrop = backdrop;
  if (m.overview) out.overview = String(m.overview).slice(0, 2000);
  if (typeof m.vote_average === "number" && m.vote_average > 0) out.rating = m.vote_average;
  return out;
}

// A ref is opaque to Kino and may come back from the person's library long after it was handed out,
// so it is parsed once and each caller takes only what it needs. The limit is Kino's: a ref may be up to
// 4096 characters (2048 is the cursor's limit, a different thing), and a ref kept in the person's library
// must not be dropped for being longer than a cursor.
const REF_MAX = 4096;

function parseRef(ref) {
  if (typeof ref !== "string" || ref === "" || ref.length > REF_MAX) return null;
  let spec;
  try {
    spec = JSON.parse(ref);
  } catch {
    return null;
  }
  return spec && typeof spec === "object" ? spec : null;
}

// browse() only ever asks TMDB for a list path; anything else is refused before it leaves. A ref may also
// carry the parameters of a `/discover` list (the genre tiles), so those are filtered to plain values
// with plain names before they are handed to TMDB.
const PARAM_NAME_RULE = /^[a-z][a-z0-9._]{0,40}$/;

function cleanParams(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out = {};
  let count = 0;
  for (const name of Object.keys(raw)) {
    if (count >= 20) break;
    if (!PARAM_NAME_RULE.test(name)) continue;
    const value = raw[name];
    const type = typeof value;
    if (type !== "string" && type !== "number" && type !== "boolean") continue;
    if (type === "string" && value.length > 500) continue;
    out[name] = value;
    count++;
  }
  return Object.keys(out).length ? out : null;
}

function listRef(spec) {
  if (!spec || typeof spec.path !== "string" || !PATH_RULE.test(spec.path) || spec.path.indexOf("..") !== -1) return null;
  if (spec.kind !== "movie" && spec.kind !== "tv") return null;
  return { path: spec.path, kind: spec.kind, params: cleanParams(spec.params) };
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

// Runs the checks a rated image needs before anything is built, then turns a list of row specs into
// Kino rows. Home and the plugin's own section share it, so the two can never drift apart.
async function buildRows(specs) {
  await ensureProbe();
  await ensureTuningProbe();
  await ensureBackdropProbe();
  const pages = await Promise.all(specs.map((row) => tmdb(row.path, row.params)));
  const rows = [];
  const seen = {};
  specs.forEach((row, i) => {
    const items = results(pages[i]).map((m) => item(m, row.kind)).filter(Boolean);
    // A title only appears in the first row that brought it. Without this, the same film showed up in
    // "Tendencias", "Mejor valoradas" and "En cines" of the same Home: the lists overlap by nature, and
    // Kino only checks for repeats WITHIN a row.
    const fresh = items.filter((one) => {
      if (!one || seen[one.id]) return false;
      seen[one.id] = true;
      return true;
    });
    if (!fresh.length) return;
    rows.push({
      id: row.id,
      title: t(row.title),
      items: fresh,
      // A row with a ref and a browse() gets the "Ver más" card.
      ref: JSON.stringify({ path: row.path, kind: row.kind, params: row.params, list: true }),
      genre: row.genre,
    });
  });
  return rows;
}

export async function home() {
  try {
    return await buildRows(ROWS);
  } catch (e) {
    // No rows instead of an error: a Kino with no kino.tmdb at all, or one whose TMDB key is missing or
    // momentarily out of reach. Home is never blocked by a plugin that contributes nothing.
    if (e && (e.code === "no_tmdb_key" || e.code === "unavailable")) {
      log("TMDB no disponible (" + e.code + "): el Inicio no aporta filas");
      return [];
    }
    throw e;
  }
}

// The plugin's own section: a sidebar entry on a television, a chip in Home on a phone. A tab is chosen
// by id; anything unrecognised falls back to the first one.
export async function section(args) {
  const asked = args && typeof args.tab === "string" ? args.tab : null;
  const chosen = SECTION_TABS.some((tab) => tab.id === asked) ? asked : SECTION_TABS[0].id;
  const tabs = SECTION_TABS.map((tab) => ({ id: tab.id, label: t(tab.label) }));
  const rows = await buildRows(SECTION_ROWS[chosen]);
  // The hero shows the first title of the tab, which the first row already brought: no extra request.
  const first = rows.length && rows[0].items.length ? rows[0].items[0] : null;
  const answer = { tabs, tab: chosen, rows };
  if (first) {
    const hero = { title: first.title };
    if (first.overview) hero.text = String(first.overview).slice(0, 300);
    const image = first.backdrop || first.poster;
    if (image) hero.image = image;
    answer.hero = hero;
  }
  return answer;
}

// The tiles of Kino's Categorías tab. Each one is a `/discover` list, and its artwork is the poster of
// the most popular title of that list, so the tile carries a note too.
//
// Both lists are flattened into one shape first: a tile is a path, some parameters and a kind of title,
// and the only thing the artwork needs is the first result of its own list.
export async function categories() {
  try {
    await ensureProbe();
    await ensureTuningProbe();
    await ensureBackdropProbe();
    const specs = LIST_TILES.concat(
      GENRE_TILES.map((tile) => ({
        id: tile.id,
        label: tile.label,
        kind: tile.kind,
        path: tile.kind === "tv" ? "/discover/tv" : "/discover/movie",
        params: { with_genres: tile.genre, sort_by: "popularity.desc" },
      }))
    );
    const pages = await Promise.all(specs.map((spec) => tmdb(spec.path, spec.params).catch(() => null)));
    const tiles = [];
    specs.forEach((spec, i) => {
      const first = results(pages[i])[0];
      const tileArt = first ? art(first, "poster", spec.kind) : undefined;
      const out = {
        id: spec.id,
        title: String(spec.label).slice(0, 40),
        ref: JSON.stringify({ path: spec.path, kind: spec.kind, params: spec.params, list: true }),
      };
      if (tileArt) out.art = tileArt;
      tiles.push(out);
    });
    return tiles;
  } catch (e) {
    // A group that fails contributes nothing; Kino is not blocked by it.
    log("no pude armar las categor\u00edas: " + (e && e.message ? e.message : e));
    return [];
  }
}

export async function browse(ref, cursor) {
  const spec = listRef(parseRef(ref));
  if (!spec) return { items: [] };
  await ensureProbe();
  await ensureTuningProbe();
  await ensureBackdropProbe();
  const page = Math.max(1, parseInt(cursor, 10) || 1);
  // The ref's own parameters (a `/discover` genre) go through, but `page` always wins.
  const data = await tmdb(spec.path, Object.assign({}, spec.params, { page }));
  const items = results(data).map((m) => item(m, spec.kind)).filter(Boolean);
  const next = nextCursor(data, page);
  return next ? { items, next } : { items };
}

export async function search(query) {
  const q = query && query.q ? String(query.q).trim() : "";
  if (!q) return [];
  await ensureProbe();
  await ensureTuningProbe();
  await ensureBackdropProbe();
  const page = Math.max(1, parseInt(query && query.cursor, 10) || 1);

  // scopedSearch: la persona escribe en la lupa de una página "Ver más" (un género, una fila temática).
  // Sin esto, Kino solo filtra los títulos que ya tiene cargados, así que buscar «naruto» dentro de Anime
  // solo encontraba algo si Naruto estaba entre las primeras tarjetas. Con esto se le pregunta a TMDB.
  const within = query && typeof query.within === "string" ? query.within : "";
  if (within) {
    const spec = scopedSpec(within);
    if (!spec) return null;   // Kino filtra lo que tiene: mejor que devolver la página entera.
    const data = await tmdb(spec.path, Object.assign({}, spec.params, { with_text_query: q, page }));
    const items = results(data).map((m) => item(m, spec.kind)).filter(Boolean);
    const next = nextCursor(data, page);
    return next ? { items, next } : items;
  }

  const data = await tmdb("/search/multi", { query: q, include_adult: false, page });
  const items = results(data)
    .filter((m) => m.media_type === "movie" || m.media_type === "tv")
    .map((m) => item(m, m.media_type))
    .filter(Boolean);
  const next = nextCursor(data, page);
  return next ? { items, next } : items;
}

// The ref of a "Ver más" page, if a text filter makes sense on it.
//
// Only the `/discover` paths take `with_text_query`; on `/movie/popular` or `/trending/...` TMDB ignores
// it and the "search" would answer the whole page, which is worse than not offering it. Measured against
// the real API: `with_text_query` matches the LOCALIZED title too ("interestelar" finds Interestelar,
// "juego de tronos" finds Juego De Tronos), so a search inside a genre really works for a Spanish user.
//
// The path says the kind (`/discover/tv` is series), and a ref where they disagree would build posters
// with the wrong media prefix: `movie-` on a series card is another title's poster. Refused, not guessed.
function scopedSpec(within) {
  const spec = listRef(parseRef(within));
  if (!spec) return null;
  const kindOfPath = /^\/discover\/(movie|tv)$/.exec(spec.path);
  if (!kindOfPath || kindOfPath[1] !== spec.kind) return null;
  return spec;
}

export async function episodes(ref) {
  const id = showRef(parseRef(ref));
  if (!id) return { episodes: [] };
  const path = "/tv/" + id;
  const show = await tmdb(path);
  await ensureProbe();
  await ensureTuningProbe();
  await ensureStillProbe();
  const seasons = (Array.isArray(show.seasons) ? show.seasons : [])
    .filter((s) => Number(s.season_number) > 0)
    // Kino admits up to 50 seasons per answer, so there is no reason to cut at ten and lose seasons 11+.
    .slice(0, 50);
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
      // The still comes from the server only when its probe confirmed the key can serve one.
      if (stillsOn) episode.still = stillUrl(rpdbKey(), id, episode.season, number);
      else if (e.still_path) episode.still = TMDB_STILL + e.still_path;
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
  if (!key) return null;
  const picked = pickId(query && query.ids);
  if (!picked) return null;
  // Kino gives a meta() call SIX seconds. The probe's normal patience is ten, so on a cold sandbox the
  // probe would eat the whole call and the poster would never be answered — and three timeouts in a row
  // switch the plugin off. Hence the short leash, like settingsStatus().
  await ensureProbe(2000);
  if (keyRejected) return null;
  // A bare TMDB id would make RPDB guess between films and series; `query.type` says which it is.
  const idValue = picked.idType === "tmdb" ? tmdbIdValue(query && query.type, picked.id) : picked.id;
  // Only the poster: the backdrop of a title from another source is that source's to give, and this
  // plugin never asks RPDB for a backdrop anyway.
  return { poster: imageUrl(key, picked.idType, posterType(), idValue, "poster") };
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

// ---- Lo que el formulario de ajustes cuenta (apiVersion 6) ----------------------------------------
//
// Kino llama a settingsStatus() al abrir el formulario y a action(key) al pulsar un botón, y vuelve a
// pedir el estado después de cada acción. Los dos comparten las mismas sondas que usan las imágenes, así
// que lo que dicen es lo que de verdad va a pasar: si la clave vale, y qué clases de imagen sirve el
// servidor. Es la respuesta a "¿por qué no se ven las notas?", en la propia pantalla.
const STATUS_KEY = "serverStatus";
const ACTION_KEY = "testServer";

async function probeEverything(timeoutMs) {
  await ensureProbe(timeoutMs);
  if (!rpdbKey()) return ["Sin clave: se usan las im\u00e1genes de TMDB"];
  if (keyRejected) return ["El servidor rechaz\u00f3 la clave: revisa que sea la de ese servidor"];
  const notes = ["clave \u2713"];
  await Promise.all([ensureTuningProbe(timeoutMs), ensureBackdropProbe(timeoutMs), ensureStillProbe(timeoutMs)]);
  notes.push(backdropsOn ? "fondos con nota \u2713" : "fondos: los pone TMDB");
  notes.push(stillsOn ? "fotogramas \u2713" : "fotogramas: los pone TMDB");
  if (tuningWanted()) notes.push(tuningOff ? "ajuste de notas: no lo acepta" : "ajuste de notas \u2713");
  else if (isTv()) notes.push("ajuste de notas: solo con otro servidor");
  return notes;
}

export async function settingsStatus() {
  // Kino da 10 s al formulario, así que aquí las sondas van con menos paciencia que en una llamada normal.
  try {
    const notes = await probeEverything(2500);
    return { [STATUS_KEY]: notes.join(" \u00b7 ").slice(0, 200) };
  } catch (e) {
    log("no pude armar el estado: " + (e && e.message ? e.message : e));
    return { [STATUS_KEY]: "No se pudo consultar el servidor" };
  }
}

export async function action(key) {
  if (key !== ACTION_KEY) return { message: "Acci\u00f3n desconocida" };
  resetProbes();
  try {
    const notes = await probeEverything(8000);
    return { message: notes.join(" \u00b7 ").slice(0, 300) };
  } catch (e) {
    return { message: "No se pudo consultar el servidor: " + (e && e.message ? e.message : e) };
  }
}

// Kino runs this BEFORE saving (20 s) and shows each returned message under its field. Optional: it needs
// no manifest field, the export is enough.
//
// Why it exists: every one of these three cases saves happily and is then ignored. The person thinks it
// worked and, later, that the plugin is broken — the worst kind of failure, because nothing says anything.
// Returning null accepts; a map of keys to messages refuses and NOTHING is saved, so the person keeps what
// they typed and can fix it.
export async function validateSettings(values) {
  const v = values && typeof values === "object" ? values : {};
  const problems = {};

  // A poster type with a space or an accent is not a valid type: at runtime the plugin falls back to
  // poster-default and the person never learns why their type was ignored. Capitals are fine — the plugin
  // lowercases them — and an empty value is fine too: it means the factory default.
  if (typeof v.posterType === "string" && v.posterType.trim() !== "" && !TYPE_RULE.test(v.posterType.trim().toLowerCase())) {
    problems.posterType = "Usa min\u00fasculas, n\u00fameros y guiones, como poster-default";
  }

  const key = typeof v.key === "string" ? v.key.trim() : "";
  // The free key belongs to OpenPosterDB. With RatingPosterDB the server refuses it, the probe notices and
  // every image falls back to TMDB: no ratings anywhere, and no explanation on screen.
  if (String(v.service || "").toLowerCase() === "rpdb" && key === FREE_KEY) {
    problems.key = "Esa es la clave gratuita de OpenPosterDB. En RatingPosterDB pon la tuya, o cambia el servidor";
  } else if (/\s/.test(key)) {
    // A key with a space is refused by the server, and the message it gives says nothing useful.
    problems.key = "La clave no puede tener espacios";
  }

  return Object.keys(problems).length ? problems : null;
}
