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
| `imageUrl()` | La dirección en RPDB, con el tipo de medio dentro del id y `?fallback=true`. Ver más abajo. |

El manifiesto declara **un solo host** (`api.ratingposterdb.com`) y **dos ajustes** (`key`, `posterType`).
Todo lo demás son valores fijos a propósito: ver "Lo que se simplificó".

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

**Los fondos NUNCA se le piden a RPDB.** Esto costó un fallo entero y merece un aviso: los fondos con
nota son uno de los **planes de pago** de RPDB. Con una clave que no los incluye, RPDB no sirve la
imagen, y en un **televisor** Kino dibuja las tarjetas con el `backdrop`, así que la pantalla entera se
llenó de tarjetas vacías mientras en el móvil todo se veía bien (ahí las tarjetas usan el `poster`).
Como el plugin no puede saber qué plan tiene la persona, el `backdrop` sale siempre de TMDB —gratis y
siempre disponible— y solo el `poster` sale de RPDB. `test/plugin.test.mjs` lo fija.

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

**Idioma.** TMDB no tiene `es-CO`, así que en español se pide `es-MX` y en inglés `en-US`. Los textos que
arma el código (títulos de fila, `userMessage`) sí siguen `kino.lang`, que en Kino es `es-CO` o `en-US`.

**`meta` reutiliza la misma clave y la misma sonda** que el catálogo, así que no hay dos comprobaciones.
Solo devuelve `poster`: el fondo de un título ajeno es de su fuente, y este plugin no pide fondos a RPDB.

## Lo que se simplificó (1.1.0)

La primera versión llegó a tener **ocho ajustes**: servidor, clave, fuente del póster, tipo, respaldo,
tipo de medio, fondos y llave de TMDB. Quien lo usa dijo, con razón, que parecía complicado. Se quedó en
**dos**: `key` y `posterType`. Lo demás pasó a ser valor fijo, y esto es lo que se quitó y por qué:

| Se quitó | Por qué, y cómo volver |
| --- | --- |
| `server` (servidor propio) | Añadía un ajuste `url` para apuntar a un servidor tipo OpenPosterDB. Se quitó por simplicidad. Para volver: `SERVER` es una constante; hazla salir de `setting("server", "")` con las barras finales recortadas. |
| `posterSource` (RPDB / TMDB) | Redundante: si la clave falla, el plugin **ya** cae solo a los pósters de TMDB. |
| `fallback` | Siempre `?fallback=true`, que es lo que se quiere el 99 % de las veces. |
| `idMode` | El prefijo `movie-`/`series-` es la forma correcta y está probada en la app. Si alguna vez hubiera que volver atrás, es una línea en `tmdbIdValue()`. |
| `withBackdrop` | Ver arriba: era **la causa** de que la tele se quedara en blanco. Los fondos ahora son siempre de TMDB, sin ajuste. |
| `tmdbKey` + `hosts: api.themoviedb.org` | Solo servían para Kino 0.9.52 y anteriores, que no tienen `kino.tmdb`. El plugin necesita la 0.9.53+ para el catálogo; sin esa puerta, `home()` no aporta filas y `search()` falla con `unavailable`. |

Efecto secundario bueno: el manifiesto declara **un solo host**, así que la hoja de consentimiento es más
corta y más fácil de leer.

## Lo que no está verificado

Conviene tenerlo presente antes de tocar nada:

1. **Nunca se probó con una clave real de RPDB** (quien escribió esto no tiene suscripción; el autor del
   plugin sí la usa a diario). Lo verificado contra la API real es la sonda (`HEAD` → `403` sin cuerpo;
   ninguna redirección, por eso basta declarar un host) y que la dirección que arma el plugin es la que
   RPDB entiende. El camino con clave válida lo estrenó el autor y funciona: pósters con nota en móvil.
2. **El prefijo `movie-`/`series-` sale de la documentación de la API de `openposterdb`**, el reemplazo
   *drop-in* que usa el mismo esquema de URL que RPDB. No se pudo probar contra la API real de RPDB con
   una clave inválida (la comprobación de la clave ocurre **antes** que la del id, así que todas las
   formas responden `403`), pero **sí está confirmado en la app**: con él, las series que salían mal o
   vacías salen bien.
3. `episodes()` pide las temporadas en paralelo (11 llamadas para una serie de 10 temporadas). El límite
   es de 40 llamadas cada 10 s por plugin, así que va sobrado, pero si se añaden más temporadas habrá
   que mirarlo.

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
