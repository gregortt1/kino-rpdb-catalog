# Notas técnicas y de mantenimiento

Este archivo es para quien **mantiene el código**. Lo que lee quien instala el plugin está en
[README.md](README.md).

## Índice

- [Cómo está hecho](#cómo-está-hecho)
- [Probarlo en local](#probarlo-en-local)
- [Decisiones de diseño](#decisiones-de-diseño)
- [Lo que no está verificado](#lo-que-no-está-verificado)
- [Publicar y actualizar](#publicar-y-actualizar)

## Cómo está hecho

Kino elige la imagen de un título en este orden, y se queda con la **primera**:

```
el título de su propio plugin  →  details  →  AniList  →  plugins "meta"
```

La capacidad `meta` de Kino va **la última** y solo rellena huecos, así que un plugin `meta` no puede
mejorar los pósters de un catálogo ajeno. Por eso este plugin **es un catálogo**: el póster de RPDB es
el `poster` de **su propio ítem**, y eso gana tanto en la ficha como en las miniaturas de Inicio,
búsqueda y "Ver más".

Piezas:

| Pieza | Detalle |
| --- | --- |
| `home()` | 6 filas de TMDB (`/trending`, `/movie/top_rated`, `/tv/top_rated`, `/movie/now_playing`, `/tv/on_the_air`). Una fila sin ítems no se devuelve. |
| `browse(ref, cursor)` | Pagina una fila. El `ref` lleva `{ path, kind }` y solo se acepta una ruta de TMDB. |
| `search(query)` | `/search/multi`, filtrando a `movie`/`tv`, paginado por `cursor`. |
| `episodes(ref)` | Temporadas 1..N (máximo 10) desde TMDB, con `still`, `airDate` y duración. Los capítulos con `number` 0 se descartan. |
| `meta(query)` | El relleno de huecos para títulos de OTRAS fuentes. |
| `resolve(ref)` | Siempre falla con `not_found` y una frase en el idioma de la persona. `catalogOnly` hace que Kino 0.9.54+ nunca lo llame. |
| `kino.tmdb` | La puerta de Kino a TMDB (Kino 0.9.53+). **El plugin no lleva ninguna llave de TMDB** y no declara `api.themoviedb.org`: sin esa puerta no hay catálogo, y el plugin no finge lo contrario. |
| `posterServer()` | La base de las imágenes: el servidor que escriba la persona, o RatingPosterDB. Ver más abajo. |
| `imageUrl()` | La dirección de un póster o un fondo, con el tipo de medio dentro del id y `?fallback=true`. |
| `stillUrl()` | La de un fotograma de capítulo, con su propia forma de id: `episode-{serie}-S{temporada}E{capítulo}`. |

El manifiesto declara **un solo host** (`api.ratingposterdb.com`) y **tres ajustes** (`server`, `key`,
`posterType`). Todo lo demás son valores fijos y sondas a propósito: ver "Lo que se simplificó".

## Probarlo en local

Node 18 o más nuevo. Todo es offline: `kino.tmdb` y `kino.fetch` están simulados en las pruebas, así que
no hace falta ninguna llave.

```bash
node sdk/validate.mjs .      # ¿lo instalaría Kino? -> "✓ Kino would accept this plugin"
node test/plugin.test.mjs    # 15 pruebas, sin red
```

`sdk/run.mjs` sirve para probar funciones sueltas contra TMDB de verdad, pero necesita una llave:
ponla en la variable `KINO_TMDB_KEY` o en `"tmdbKey"` dentro de `sdk/config.json` (el kit no tiene la
llave de Kino, así que ahí sí hace falta una).

## Decisiones de diseño

**La comprobación de la clave de RPDB.** Un póster roto en cada título es un fallo muy visible, así que
la clave se comprueba una vez por sesión con una petición `HEAD`. Comprobado contra la API real: RPDB
contesta `403` **sin cuerpo** a una clave inválida, así que la sonda no descarga ninguna imagen. Solo un
`401`/`403` cuenta como veredicto: un `404`, un `5xx`, un `405` (RPDB sin `HEAD`) o un fallo de red no
dicen nada sobre la clave y las respuestas salen igual. Si la clave se rechaza, `serverReady()` empieza a
devolver falso y todo el catálogo cae a los pósters de TMDB.

**RPDB solo con arte de TMDB.** RPDB construye sus pósters sobre el arte de TMDB, así que un título con
`poster_path` es uno que RPDB puede servir. Aun así a RPDB se le pide el póster sin mirar esa ruta,
porque resuelve el arte por su cuenta y su `fallback` decide qué servir.

**Los fondos y los fotogramas se comprueban antes de usarlos.** Los fondos con nota son uno de los
**planes de pago** de RPDB, y esto costó un fallo entero: con una clave que no los incluye, RPDB no sirve
la imagen, y en un **televisor** Kino dibuja las tarjetas con el `backdrop`, así que la pantalla entera
se llenó de tarjetas vacías mientras en el móvil todo se veía bien (ahí las tarjetas usan el `poster`).
Como el plugin no puede saber qué plan tiene la persona, **pregunta**: antes de usar una sola imagen de
esos tipos hace un `HEAD` de prueba, una vez por sesión, y guarda el veredicto en `backdropsOn` /
`stillsOn`. La decisión **falla en cerrado**: solo un 2xx confirmado activa el tipo, porque el daño de
equivocarse (una tele en blanco) es mucho peor que el de no usarlo (una imagen sin nota). Si falla, lo
dice en el Registro y esa imagen la pone TMDB. Una comprobación por tipo y sesión, no por título.

**El tipo de medio va dentro del id (`movie-603`, `series-1399`).** Este fue otro fallo real. Los ids de
TMDB de película y de serie son **listas distintas que colisionan**: el número 1399 existe como serie
(Juego de tronos) y puede existir como película. La URL de RPDB es
`/{clave}/{id_type}/{tipo}/{id}.jpg`, así que un número pelado obliga a RPDB a **adivinar** entre los dos
espacios, y adivina **por popularidad**: el título más popular gana y el resto recibe el póster de otro
título o ninguno.

Se vio en la app antes de entenderlo: una serie mostraba el cartel de una película alemana de los años 30
y tres series más salían en blanco, mientras que Spider-Man y Ted Lasso (muy populares) salían bien. La
documentación de la API de `openposterdb` —reemplazo *drop-in* de RPDB, mismo esquema de URL— lo dice
explícitamente: para `id_type: tmdb`, `id_value` es del tipo `movie-123` o `series-456`. IMDb no lo
necesita: `tt0944947` es inequívoco, así que `meta()` los manda sin prefijo.

**Los logos no se pueden usar.** Kino solo admite `logo` en un `LiveChannel`; un `Item` de catálogo tiene
`poster`, `backdrop` y (en un capítulo) `still`, y nada más. Un servicio que sepa dibujar logos con nota
no sirve de nada aquí: no hay campo donde devolverlos.

**Idioma.** TMDB no tiene `es-CO`, así que en español se pide `es-MX` y en inglés `en-US`. Los textos que
arma el código (títulos de fila, `userMessage`) sí siguen `kino.lang`, que en Kino es `es-CO` o `en-US`.

**`meta` reutiliza la misma clave y la misma sonda** que el catálogo, así que no hay dos comprobaciones.
Solo devuelve `poster`: el fondo de un título ajeno es de su fuente, y este plugin no pide fondos a RPDB.

## La pantalla de ajustes: de ocho a tres

La primera versión llegó a tener **ocho ajustes**: servidor, clave, fuente del póster, tipo, respaldo,
tipo de medio, fondos y llave de TMDB. Quien lo usa dijo, con razón, que parecía complicado. Hoy son
**tres**: `server`, `key` y `posterType`. Dos se quitaron del todo y dos volvieron, pero ya no como
interruptores que la persona tenga que entender:

| Ajuste | Estado |
| --- | --- |
| `server` | **Volvió** en 1.2.0. Es la vía para usar OpenPosterDB, cuyos fondos y fotogramas con nota son gratis: sin él, la única forma de tenerlos es pagar el plan de RPDB. |
| `key` | Se queda. |
| `posterType` | Se queda. |
| `posterSource` | **Quitado.** Redundante: si la clave falla, el plugin ya cae solo a las imágenes de TMDB. |
| `fallback` | **Quitado.** Siempre `?fallback=true`, que es lo que se quiere el 99 % de las veces. |
| `idMode` | **Quitado.** El prefijo `movie-`/`series-` es la forma correcta y está probada en la app. Si hubiera que volver atrás, es una línea en `tmdbIdValue()`. |
| `withBackdrop` | **Quitado**, y sustituido por la sonda de fondos. Era **la causa** de que la tele se quedara en blanco: un interruptor que la persona no podía saber si su plan soportaba. Ahora el plugin lo comprueba él. |
| `tmdbKey` + `hosts: api.themoviedb.org` | **Quitados.** Solo servían para Kino 0.9.52 y anteriores, que no tienen `kino.tmdb`. Sin esa puerta, `home()` no aporta filas y `search()` falla con `unavailable`. |

La lección de fondo: un ajuste que la persona **no puede evaluar** ("¿mi plan incluye fondos?") es un
ajuste mal puesto. Es mejor que el plugin lo compruebe y que el ajuste desaparezca.

Efecto secundario bueno: el manifiesto declara **un solo host**, así que la hoja de consentimiento es más
corta y más fácil de leer.

## Lo que no está verificado

Conviene tenerlo presente antes de tocar nada:

1. **Nunca se probó con una clave real de RPDB** (quien escribió esto no tiene suscripción; el autor del
   plugin sí la usa a diario). Lo verificado contra la API real es la sonda (`HEAD` → `403` sin cuerpo;
   ninguna redirección, por eso basta declarar un host) y que la dirección que arma el plugin es la que
   RPDB entiende. El camino con clave válida lo estrenó el autor y funciona: pósters con nota en móvil.
2. **El prefijo `movie-`/`series-` y la forma del fotograma están confirmados.** El prefijo salió de la
   documentación de `openposterdb`, el reemplazo *drop-in* de RPDB, y su **especificación OpenAPI**
   (`openposterdb.com/api/openapi.json`) lo dice con estas palabras: *"For TMDB prefix with `movie-`,
   `series-`, or `episode-` (e.g. `movie-550`, `series-1399`, `episode-1396-S1E1`)"*. Además está
   **probado en vivo**: con esa forma, la clave pública gratuita devuelve JPEG reales de póster
   (580×870), fondo (1920×1081) y fotograma (780×439). Y en la app, con RPDB, arregló las series que
   salían mal o vacías.
3. **La sonda de imágenes funciona en los dos servicios.** Comprobado en vivo contra OpenPosterDB: `HEAD`
   responde `302` con una clave válida y `401` con una inválida, y **la redirección se queda en el mismo
   host** (`openposterdb.com/... → openposterdb.com/c/{hash}/...`), así que la regla de hosts de
   `kino.fetch` no la bloquea. RPDB contesta `403` sin cuerpo. Por eso una sola forma de sonda sirve para
   ambos.
4. `episodes()` pide las temporadas en paralelo (11 llamadas para una serie de 10 temporadas). El límite
   es de 40 llamadas cada 10 s por plugin, así que va sobrado, pero si se añaden más temporadas habrá
   que mirarlo.

## Lo que descubrió la especificación de OpenPosterDB

Su OpenAPI (`openposterdb.com/api/openapi.json`, 23 KB) documenta más de lo que el plugin usa, y conviene
tenerlo a mano si algún día se quiere afinar la imagen sin tocar el código de Kino:

- **Una clave pública gratuita**: `t0-free-rpdb`, y un endpoint `GET /{api_key}/isValid` que responde
  `{"valid":true}`. Con ella no hace falta registrarse para nada.
- **`fallback` no hace nada ahí**: *"Accepted for RPDB compatibility but has no effect. OpenPosterDB uses
  TMDB as a fallback source instead of returning a 1x1 pixel placeholder"*. Ojo al detalle: significa que
  **RPDB sí devuelve un píxel de 1×1** cuando no puede construir la imagen. Eso explica alguno de los
  recuadros vacíos que se vieron, y es un buen motivo para no fiarse solo de un `200`.
- Parámetros de acabado que se podrían exponer como ajustes si alguien los pide: `ratings_limit`,
  `ratings_order`, `ratings_exclude`, `badge_style`, `badge_size`, `badge_shape`, `badge_background`,
  `position`, `label_style`, `imageSize` (`small` solo en fondos), `textless`, `fit`, `split`, y `blur`
  para no destripar un capítulo.
- **`imageSize=large` no compensa**: el fondo por defecto ya sale a 1920×1081 (222 KB) y el `large` son
  3840×2160 (1,3 MB) para una tele que casi siempre es 1080p.

## Publicar y actualizar

- El repositorio tiene que ser **público** y **no un fork**: Kino deja los forks fuera de "De la
  comunidad".
- El topic **`kino-plugin`** en el repositorio es lo que hace que aparezca en la tienda de Kino. Sin él,
  el plugin funciona pero solo se instala escribiendo su dirección.
- **Sube `"version"` en cada cambio**: Kino solo instala una actualización si el número es mayor. Las
  pruebas no comprueban la versión, así que es fácil olvidarlo.
- Todo lo que Kino llama tiene que seguir exportado: `home`, `browse`, `search`, `episodes`, `meta` y
  `resolve`. Quitar uno rompe la instalación con "El plugin no carga: le falta …".
- `sdk/validate.mjs` reproduce los mensajes de la app. Si una regla del manifiesto se rompe, lo dice con
  el mismo texto que vería la persona.
