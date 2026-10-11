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
| `home()` | 11 filas de TMDB. Las cuatro temáticas primero (anime, documentales, infantil, doramas) porque el tipo de un título lo decide la primera fila en que aparece, y después tendencias, mejor valoradas, en cines, al aire y próximos estrenos. Una fila sin ítems no se devuelve. |
| `section({ tab })` | La sección propia: dos pestañas (Películas, Series) con sus filas y un destacado. Ver abajo. |
| `categories()` | Los mosaicos de Categorías: doce géneros como listas `/discover`. Ver abajo. |
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

### El Home por categorías: `genres` en cada ítem (1.14.0)

**Esta sección corrige un error mío.** En la 1.13.0 afirmé, y quedó escrito en el README, que las
categorías eran una lista cerrada de diez y que por eso «Populares» o «Mejor valoradas» no podían ser un
chip. Era cierto **a medias**: leí la guía del repositorio de plugins y la página de la API, pero **no** la
página [Home por categorías](https://kinotvapp.github.io/kino-plugins/categories/), que es donde está todo
esto. Quien usa el plugin la señaló, y tenía razón. Lo que dice:

- Kino tiene un **Home por categorías** (un experimento, apagado por defecto): una sola lista con **una
  fila por categoría** y una tarjeta por título. Se arma **solo con lo que `home()` dejó guardado**.
- **Las filas de género se llenan con los `genres` de cada ÍTEM** (`["accion", "drama"]`), no con el
  `genre` de la fila. Un título con géneros **no** aparece en la fila genérica «Películas»; aparece en las
  de género.
- El vocabulario es **mucho más amplio** que los diez ids: hay géneros de vídeo (20), géneros de anime
  (`shonen`, `isekai`, `mecha`, `escolar`, `slice-of-life`), tipos temáticos (`anime`, `doramas`,
  `infantil`, `documentales`, `clasicos`, `deportes`, `noticias`), tipos de audio y géneros de audio.
- **Desde la próxima versión** el `genre` de una fila acepta **cualquier** categoría (se canoniza a un
  slug); un Kino anterior ignora lo que no estuviera en los diez.
- El **tipo** de un título lo decide **la primera fila en que aparece**.

Lo que se hizo con eso:

- **`KINO_GENRE_BY_TMDB` + `genresOf()`**: los `genre_ids` de TMDB (que vienen en todas las listas) se
  traducen a los ids de Kino y se ponen en `genres` de cada ítem. Varios ids de TMDB apuntan al mismo de
  Kino (`10759` Action & Adventure → `accion`, `10766` Soap → `drama`), así que se deduplica, y Kino admite
  cinco como mucho. Los ids de **tipo** no están en el mapa a propósito: Kino ignora un tipo dentro de
  `genres`.
- **Dos filas nuevas**: **Infantil** (`with_genres=16,10751`, animación Y familia) y **Doramas**
  (`with_original_language=ko` + drama). Cada una con su `genre` de tipo, así que sus títulos aparecen en
  esas filas completas.
- **Las filas temáticas van PRIMERO en `home()`** (Anime, Documentales, Infantil, Doramas y después el
  resto). Es lo que hace que un anime que también es tendencia se marque como anime y llegue a su fila.
  En el Home por categorías el orden de las filas lo pone Kino, así que ahí no se pierde nada; en el Home
  clásico solo cambia el orden.
- **En la sección NO se reordenó.** La sección no alimenta el Home por categorías, y poner las temáticas
  primero cambiaría el **destacado** (saldría un documental en vez de la película en tendencia). Cada cosa
  en su sitio.

De paso, los tests dejaron de depender del **índice** de la fila: buscaban `rows[0]`, y al reordenar se
rompieron diez de golpe. Ahora hay `filmsRow(rows)` / `showsRow(rows)` / `film0(rows)` / `show0(rows)`, que
buscan por id. Un índice es una posición; un id es un hecho.

### Pestañas, notas del fondo y póster sin texto (1.13.0)

Tres peticiones, y una de ellas se contestó con un "no" documentado.

**Pestañas en el formulario: no existen.** La documentación actual de la API lista los tipos de ajuste
—`text`, `url`, `password`, `select`, `toggle`, `list`, `section`, `status`, `action`— y no hay ninguno de
pestañas: dentro del formulario, `section` (un encabezado con su explicación) es lo único que agrupa. Un
plugin recibe **su propia pestaña en Ajustes** para todo el formulario, pero no puede partirla. Así que la
respuesta es no, y los cuatro `section` son el límite de lo que se puede hacer. Dato útil que salió en la
misma lectura: un `select` **sin** `default` vale su primera opción (nunca queda vacío), así que poner
`default` explícito siempre es lo correcto.

**Chips del Inicio: son diez y no se inventan.** `genre` es una lista cerrada (`peliculas`, `series`,
`anime`, `infantil`, `documentales`, `deportes`, `noticias`, `musica`, `entretenimiento`, `otros`), así que
"Tendencias de hoy", "Populares" o "Mejor valoradas" **no pueden ser un chip**. Donde sí caben es en las
**pestañas de la sección** (Kino admite hasta 8) y en los **mosaicos de `categories()`** (hasta 24). De ahí
la 1.13.0: la sección pasa a seis pestañas —dos por lo que el título ES y cuatro por lo que la lista ES— y
`categories()` gana cinco mosaicos de lista delante de los doce de género.

**"Todas las notas" y el póster sin texto**, los dos medidos antes de ofrecerlos:

- Los fondos aceptan mucho más de tres: con `ratings_limit=8` el servidor devuelve ocho notas **en una
  sola fila** y sin solaparse (más allá de ocho no da más: `ratings_limit=10` devuelve el mismo archivo
  que 8). Por eso `RATINGS.all` (ocho, sin exclusiones) se ofrece **solo en el grupo del fondo**: en un
  póster ocho notas se envuelven sobre el título.
- `textless=true` sí cambia la imagen (comprobado en dos títulos, con archivos de bytes distintos) y es un
  booleano documentado que el servidor acepta, así que **no necesita sonda**: cuando no hay versión sin
  texto sirve la normal. Va como `toggle` apagado por defecto y **solo en el póster**, que es donde la
  fila de notas choca con el título impreso.

**Un detalle de `kino.tmdb` que conviene tener anotado**: máximo **40 llamadas cada 10 s** por plugin, en
un balde de fichas, y **sin límite de llamadas simultáneas** (el de 6 en vuelo es de `kino.fetch`, no de
`kino.tmdb`). Además cachea 10 minutos en memoria por ruta y parámetros. Por eso las 17 llamadas de
`categories()` o las 9 del Inicio en paralelo están bien; aun así, iremos con cuidado si algún día se
suman muchas más.

### El nombre, el `genre` y los ajustes por imagen (1.12.0)

**El nombre.** Pasa de «Catálogo con notas» a **OpenPoster**, a petición de quien lo usa. El **`id` no se
toca** (`rpdb-catalog`): cambiarlo haría que Kino lo viera como otro plugin y se perderían los ajustes
guardados y el consentimiento. El `name` es libre, el `id` no.

**El `genre` de las filas.** La guía lo dice en una línea que es fácil pasar por alto: `genre` no es
`peliculas`/`series`, es una **lista cerrada de diez** (`peliculas`, `series`, `anime`, `infantil`,
`documentales`, `deportes`, `noticias`, `musica`, `entretenimiento`, `otros`) y **es lo que usa Kino para
agrupar las filas de todas las fuentes**: la pestaña Categorías las junta por ahí, y el Inicio muestra esas
categorías como chips. La fila de Anime iba marcada como `series` y la de Documentales como `peliculas`,
así que existían pero **dentro de otra categoría**: de ahí que el Inicio solo enseñara Películas y Series.
Corregido a `anime` y `documentales`. Sin `genre`, Kino lo adivina por el título de la fila.

**Los ajustes, por tipo de imagen.** La 1.10.0 dejó una sola pareja de ajustes de notas y tamaño para las
tres imágenes. Es el mismo error que ya se había corregido con la posición, y se corrige igual: `groupOf()`
reparte los ajustes en dos grupos, `poster*` y `backdrop*`, y `groupSetting(kind, "Ratings", …)` lee el que
toca. Los **capítulos van con el fondo** (los dos son 16:9), salvo su posición, que sigue fija.

- `imageSize` solo se manda cuando la imagen no es un póster: en un póster no escala nada.
- El valor por defecto pasa a ser **tres notas** (`imdbRtMc`) en los dos grupos, que es lo que se pedía y
  lo que el tope de tamaño hace que quepa.
- **Los ajustes viejos (`tvRatings`, `tvBadgeSize`, `tvBadgePosition`) quedan huérfanos**: Kino no borra lo
  guardado, pero el plugin ya no los lee, así que vuelven a su valor de fábrica. Hay que volver a elegirlos
  una vez.

Y un fallo que cazó una prueba y que merece la pena recordar: el valor de reserva de `ratingsMode()` estaba
escrito `"imdbRtMc"` (camelCase) mientras las claves de `RATINGS` son minúsculas (`imdbrtmc`), así que
`RATINGS[valor]` era `undefined` y reventaba al leer `.count`. Las claves se normalizan con
`toLowerCase()`, pero **las constantes escritas a mano no se normalizan solas**.

### Anime, Documentales y Próximamente (1.11.0)

Tres filas más, en Inicio y una en cada pestaña de la sección. No son listas de TMDB: son `/discover`, así
que van con parámetros y el `ref` de la fila tiene que llevarlos para que su "Ver más" pida lo mismo.

- **Anime** = `with_genres=16&with_original_language=ja`. El filtro de idioma **no es opcional**: sin él,
  "Animation" trae también todos los dibujos occidentales, que no es lo que nadie espera de una fila
  llamada Anime.
- **Documentales** = `with_genres=99`, que sirve igual para películas y para series.
- **Próximamente** = `/movie/upcoming`, que la sección ya usaba.

`ANIME_PARAMS` y `DOCS_PARAMS` están declarados **antes** de `ROWS` a propósito: los `const` se evalúan en
orden y usarlos desde `ROWS` antes de declararlos sería un error de zona muerta temporal, no un aviso.

El fixture de las pruebas tuvo que **aprender a responder según los parámetros**: `/discover/movie` tiene
que devolver documentales cuando se pide el género 99, y otra cosa cuando lo pide un mosaico de categoría.
El doble de `kino.tmdb` acepta ahora una función por ruta, y sin eso las dos filas no se podrían comprobar
por separado (ambas caerían en el mismo resultado y la deduplicación se llevaría una).

### Que las notas quepan en una fila (1.10.0)

Reportado con una foto de la tele: en los pósters las notas aparecían **una encima de otra**. Medido contra
el servicio real, la causa no era el apilado sino el **ancho**:

| | 1 nota | 2 notas | 3 notas |
| --- | --- | --- | --- |
| `badge_size=xl` | una fila | una fila | **2 + 1** |
| `badge_size=l` | una fila | una fila | **2 + 1** |
| `badge_size=m` | una fila | una fila | **una fila** |

Con tres notas a `l` o `xl` el servidor las envuelve: dos en una línea y la tercera debajo, justo **encima
del título del póster**. A `m` caben las tres en una sola línea. De ahí `badgeSize(kind, chosen)`: mantiene
el tamaño elegido y solo lo baja a `m` cuando son tres notas **y** la imagen es un póster. En el fondo, que
es ancho, las tres caben a `l` sin tocar nada.

Dos cosas más que se midieron y evitaron una solución equivocada:

- **`badge_direction` no era el problema.** `d` y `h` devuelven el **mismo archivo** (la disposición por
  defecto ya es horizontal); solo `v` cambia. Si se hubiera dado por hecho que "se apilan en columna", se
  habría añadido un parámetro que no arregla nada.
- **`split=true` no sirve aquí.** Con 3 notas reparte una arriba y dos abajo (queda bien), pero **con 2 las
  separa**: una arriba y otra abajo. Descartado.

Y de paso se rehizo la lista de notas. El orden propio del servidor empieza por **MyAnimeList y
Letterboxd**, así que en "automático" una película corriente salía con IMDb, Letterboxd (sobre 5) y RT:
mezcla rara. `RATINGS` declara ahora, por opción, el orden, las claves que se conservan y cuántas son; el
`ratings_exclude` se **calcula** como el resto de `RATING_KEYS`, en vez de estar escrito a mano, y solo se
manda si queda algo (una lista vacía podría ser un 400 y tumbar la imagen entera).

### La posición es por imagen, y no se repiten títulos (1.9.0)

Dos correcciones que salieron de usar el plugin de verdad:

**La posición, por tipo de imagen.** La 1.8.0 tenía una sola `tvBadgePosition` que se aplicaba a las tres
imágenes. Quien lo usa lo dijo claro: *"en los pósters siempre tiene que estar abajo centrado, en los
episodes tiene que estar arriba a la derecha y solo en los backdrops que me dé la libertad"*. Así que
`tuningQuery(mode, kind)` recibe ahora el tipo, y `positionFor(kind)` decide:

| kind | posición | Por qué |
| --- | --- | --- |
| `poster` | `bc` fija | Es vertical y su nota siempre ha ido abajo, centrada. |
| `still` | `tr` fija | La tarjeta de capítulo es 16:9 y la nota va arriba a la derecha. |
| `backdrop` | la que elija la persona | Es el único que Kino recorta a lo ancho en una tele. |

`artUrl()` y `imageUrl()` llevan el `kind` por parámetro, y las sondas también (la de la clave y la del
ajuste usan `poster`, la de fondos `backdrop` y la de fotogramas `still`). **Ojo con un detalle que casi se
cuela**: al añadir el parámetro quedaron *dos definiciones de `artUrl`* en el archivo, y en JavaScript la
última gana — habría ignorado el `kind` en silencio, sin fallar ninguna prueba. Se detectó con un `grep`
buscando funciones repetidas, y merece la pena repetir esa comprobación antes de dar por bueno un cambio.

**No repetir títulos entre filas.** Las listas de TMDB se solapan por naturaleza, y **Kino solo comprueba
repeticiones dentro de una fila**: la misma película salía en Tendencias, Mejor valoradas y En cines del
mismo Inicio. `buildRows()` lleva ahora un registro de ids ya usados y un título solo aparece en la
primera fila que lo trae. Es una regla por llamada, así que la sección y el Inicio no se estorban.

El fixture de las pruebas tuvo que rehacerse a raíz de esto: reutilizaba los mismos dos títulos en todas
las listas, así que al cruzar filas se quedaban vacías. Ahora cada lista trae títulos distintos **y uno
compartido a propósito** (el id `mv-607`), que es lo que comprueba el test nuevo.

### Dónde va la nota (1.8.0)

El servidor acepta ocho anclas en `position`: `bc`, `tc`, `l`, `r`, `tl`, `tr`, `bl`, `br`. Medido contra
el servicio real: **las ocho devuelven una imagen distinta** (póster y fondo), así que el parámetro se
respeta de verdad.

Y un detalle que no era obvio y que fija el valor por defecto: **sin `position`, el fondo sale con la nota
en `tr`** (esquina superior derecha) — la firma de bytes de una petición sin el parámetro es idéntica a la
de `position=tr`. Por eso `tvBadgePosition` trae `auto`, que significa "no mandes el parámetro": cambiar el
aspecto de quien no ha pedido nada es justo lo que se ha criticado en este plugin.

Con las ocho posiciones se descargó el fondo, se redujo a **ancho de tarjeta de tele (470 px)** y se miró
antes de ofrecerlas. Conclusión anotada también en el README: las esquinas quedan muy al borde (pueden
rozar el redondeo de la tarjeta o el cartel de "Ver más"); las centradas son las más limpias.

Un valor que no sea una de las ocho no inventa nada: `badgePosition()` devuelve cadena vacía y la
dirección sale igual que con `auto`.

### El diagnóstico en el formulario (1.7.0)

Esta es la función que habría ahorrado los tres primeros ida y vuelta de este plugin. El síntoma era
"algunas imágenes no salen" y no había forma de saber si era la clave, el plan, un parámetro o el host:
había que activar el modo debug, leer el Registro y mandarlo. Kino tiene desde apiVersion 6 dos cosas
hechas para esto, y ahora las usa:

- **`settingsStatus()`** — Kino lo llama al abrir el formulario (10 s de límite) y muestra el texto que
  devuelva bajo el ajuste `status`. Devuelve una línea como
  `clave ✓ · fondos con nota ✓ · fotogramas ✓ · ajuste de notas ✓` (máximo 200 caracteres).
- **`action("testServer")`** — el botón "Probar el servidor" (30 s). Llama a `resetProbes()` y vuelve a
  comprobar **de cero**, para que sirva justo después de cambiar la clave. Devuelve un `message` (máximo
  300 caracteres). Kino vuelve a pedir el estado después de cada acción, así que la línea se actualiza.

Los dos comparten `probeEverything()`, que son **las mismas sondas que deciden las imágenes**: lo que dice
el formulario es lo que va a pasar de verdad, no una comprobación aparte que podría mentir.

Detalle que importa: al formulario Kino le da 10 s, así que `settingsStatus()` llama a las sondas con
**2,5 s de paciencia** en vez de 10, y las tres de capacidad (fondos, fotogramas y ajuste) van **en
paralelo** (`Promise.all`, y Kino permite 6 a la vez). Peor caso: ~5 s. El botón usa 8 s, que con el
límite de 30 va sobrado.

### La sección propia y los mosaicos (1.6.0)

`section()` y `categories()` son las dos formas que da Kino a un plugin de tener su propio sitio. Ninguna
necesita capacidad nueva: la sección solo necesita el export y `"section"` en el manifiesto (Kino rechaza
la instalación si declara uno y no lo exporta), y `categories()` se descubre por el export, con `browse`
ya declarada.

- **`home()` y `section()` comparten `buildRows()`**, para que las dos no se separen nunca: mismas
  comprobaciones previas (clave, ajuste, fondos), mismas filas, mismo `ref` con "Ver más".
- El **destacado** de la sección sale del primer título de la primera fila, que ya se pidió: no cuesta
  ninguna petición.
- Una pestaña desconocida (o `null`) cae a la primera; nunca es un error.
- Los **mosaicos de género** son listas `/discover`, así que su `ref` tiene que llevar parámetros. Eso
  obligó a extender `listRef()`: un ref puede traer un objeto `params`, y `cleanParams()` deja pasar solo
  nombres (`^[a-z][a-z0-9._]{0,40}$`) y valores simples (texto, número o booleano, hasta 500 caracteres;
  como mucho 20). En `browse()`, `page` siempre gana sobre lo que venga en el ref.
- El arte de cada mosaico es el póster del título más popular de esa lista, pasado por `art()`, así que
  **el mosaico también lleva nota**.
- `"theme": { "highlight": "#F5C518" }` tiñe solo el título del grupo en Categorías. Es el único color
  que se declara: los demás tocarían el fondo y las tarjetas de la persona, y Kino tiene reglas de
  contraste que harían caer alguno en silencio.

## La pantalla de ajustes: de ocho a tres

La primera versión llegó a tener **ocho ajustes**: servidor, clave, fuente del póster, tipo, respaldo,
tipo de medio, fondos y llave de TMDB. Quien lo usa dijo, con razón, que parecía complicado. Hoy son
**cinco**, y dos de ellos solo actúan en la tele:

| Ajuste | Estado |
| --- | --- |
| `service` | **Elegido de una lista** desde 1.5.0 (antes había que escribir la dirección). Ver abajo. |
| `key` | Se queda, y desde 1.5.0 trae `default: "t0-free-rpdb"`. |
| `posterType` | Se queda. |
| `tvRatings`, `tvBadgeSize` | Se quedan, y solo se aplican con `kino.device === "tv"`. |
| `posterSource` | **Quitado.** Redundante: si la clave falla, el plugin ya cae solo a las imágenes de TMDB. |
| `fallback` | **Quitado.** Siempre `?fallback=true`, que es lo que se quiere el 99 % de las veces. |
| `idMode` | **Quitado.** El prefijo `movie-`/`series-` es la forma correcta y está probada en la app. Si hubiera que volver atrás, es una línea en `tmdbIdValue()`. |
| `withBackdrop` | **Quitado**, y sustituido por la sonda de fondos. Era **la causa** de que la tele se quedara en blanco: un interruptor que la persona no podía saber si su plan soportaba. Ahora el plugin lo comprueba él. |
| `tmdbKey` + `hosts: api.themoviedb.org` | **Quitados.** Solo servían para Kino 0.9.52 y anteriores, que no tienen `kino.tmdb`. Sin esa puerta, `home()` no aporta filas y `search()` falla con `unavailable`. |

La lección de fondo: un ajuste que la persona **no puede evaluar** ("¿mi plan incluye fondos?") es un
ajuste mal puesto. Es mejor que el plugin lo compruebe y que el ajuste desaparezca.

### Escribir la dirección del servidor, fuera

La 1.2.0 pedía la dirección en un ajuste `url`, pensando en admitir un OpenPosterDB casero. Quien lo usa
propuso algo mejor: **una lista con los servidores ya puestos, para elegir en vez de escribir**. Y tiene
una ventaja de fondo: una dirección escrita a mano solo servía para que Kino convirtiera ese host en
alcanzable, y eso se consigue igual declarándolo.

Desde 1.5.0:

- `service` es un `select` (`rpdb`, `openposterdb`) y **los dos van declarados en `hosts`**, así que Kino
  los lista en la hoja de consentimiento y `kino.fetch` llega a ambos sin ningún ajuste `url`. De paso,
  `usesRpdb()` decide con eso si el ajuste de la tele aplica.
- La clave trae `default: "t0-free-rpdb"`, así que **una instalación nueva funciona sin tocar nada**.
- El "servidor propio en casa" queda fuera a propósito (necesita el ajuste `url`). Volver a admitirlo es:
  reponer el ajuste `url`, leerlo en `posterServer()` cuando `service === "own"`, y dejar de declarar
  hosts fijos. Anotado por si se pide.
- Efecto secundario: la hoja de consentimiento pasa de tres entradas (una de ellas fantasma) a dos
  exactas.

### El `id` no se toca, aunque el nombre sí

El plugin se llamaba "Catálogo con pósters RPDB" y se renombró a **"Catálogo con notas"** en 1.3.1, porque
en 1.2.0 pasó a poder usar cualquier servidor del mismo tipo (OpenPosterDB incluido) y el nombre ya
prometía una fuente concreta que no era la única.

El campo **`id` sigue siendo `rpdb-catalog`** y no se cambia: la guía de Kino es explícita en que el `id`
es la identidad del plugin y no debe cambiarse cuando ya hay gente que lo instaló. Cambiarlo haría que
Kino lo tratara como un plugin distinto y dejaría dos instalaciones. Lo mismo vale para el nombre del
repositorio: renombrarlo rompería la dirección con la que está instalado.

### Los hosts aprobados se acumulan en Kino

Vale la pena saberlo al leer la hoja del plugin: **Kino no olvida un host que la persona ya aprobó**,
aunque una versión posterior del manifiesto deje de declararlo. La 1.0.x declaraba `api.themoviedb.org`
para el respaldo de TMDB de los Kinos anteriores a la 0.9.53; desde la 1.1.0 no se declara, pero sigue
apareciendo en "Se conectará a" de una instalación que viene de antes. No se puede limpiar desde el
manifiesto: hay que **desinstalar y volver a instalar** para que Kino pida el consentimiento de cero.

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
- Parámetros de acabado: `ratings_limit`, `ratings_order`, `ratings_exclude`, `badge_style`, `badge_size`
  (`xs`, `s`, `m`, `l`, `xl`), `badge_shape`, `badge_background`, `position`, `label_style`, `imageSize`
  (`small` solo en fondos), `textless`, `fit`, `split`, y `blur` para no destripar un capítulo.

### Lo que se midió, no se supuso

Los ajustes de acabado salieron de medir contra el servicio real, no de leer el spec y confiar:

| Medición | Resultado |
| --- | --- |
| ¿Se respetan los parámetros? | Sí: `badge_size`, `imageSize`, `ratings_order` y `ratings_limit` dan bytes distintos cada uno. |
| Tamaños del fondo | `small` 1280×720 (129 KB) · por defecto **1920×1081 (172-222 KB)** · `large` 3840×2160 (1,25-1,34 MB). |
| Notas por defecto | La clave gratuita trae `ratings_limit: 5` en fondos, así que salían cinco o seis apiladas. |
| Tamaño real de las notas | Se descargó el mismo fondo con `badge_size` `xs`/`s`/`m`/`l`/`xl`, se redujo cada uno a **ancho de tarjeta de tele (470 px)** y se miró: con el `m` por defecto es una tira ilegible; con `l` y una sola nota se lee sin esfuerzo. |

### `ratings_order` NO restringe: hay que excluir

Este fue un error de apreciación que costó un ida y vuelta, y conviene no repetirlo. `ratings_order`
**solo ordena**: cuando la primera fuente no tiene dato, **cae a otra**. Pedir
`ratings_order=imdb&ratings_limit=1` no da "solo IMDb", da "IMDb si lo hay, y si no lo que sea".

Se comprobó con la serie del usuario, *Lanterns* (**TMDB 95350**, IMDb `tt26545992`), comparando tres
direcciones por capítulo: sin notas (`ratings_limit=0`), solo por orden, y con exclusión. Resultado:

| Capítulo | por orden | con exclusión | De dónde venía |
| --- | --- | --- | --- |
| S1E1 | nota | nota | **IMDb** |
| S1E2…S1E6 | nota | **sin nota** | otra fuente |

O sea: en esa serie **IMDb solo tiene nota para el capítulo 1**, y con exclusión estricta los otros cinco
se quedan sin ninguna. Eso no es un fallo: es lo que significa "solo IMDb", y por eso la interfaz ofrece
también `IMDb y TMDB si no hay` y `Automático`.

La exclusión se hace listando **todas** las claves del servidor menos `imdb`
(`mal,lb,rt,mc,rta,tmdb,trakt,mdblist,ebert`, tomadas de su propio `/api/free-key/settings`).

⚠️ **Y aquí está la trampa**: una clave que el servidor **no** conozca en `ratings_exclude` hace que
responda **`400`** y la imagen se pierde entera (comprobado: `?ratings_exclude=no-existe,imdb` → 400).
Como esa lista es del servidor y podría cambiar, el ajuste se prueba antes con una sonda propia
(`ensureTuningProbe`) y **si falla se suelta el ajuste, no las imágenes**: la dirección vuelve a la del
servidor con sus notas por defecto. Las tres sondas van separadas a propósito: la de la clave y las de
capacidad usan `mode: "none"` (sin ajuste), para que un parámetro rechazado nunca se confunda con "este
servidor no sirve fondos" ni con "la clave es mala".

### El ajuste es de la tele, y por qué

Los ajustes de un plugin **viajan con la cuenta**, así que un ajuste pensado para la tele cambiaba
también el celular — que es exactamente lo que pasó y de lo que se quejó el usuario. La solución es
`kino.device`, que es para esto: `isTv()` es `kino.device === "tv"` y **todo lo demás se trata como
celular** (es `undefined` antes de Kino 0.9.55). En el celular no se manda ningún ajuste, así que ve los
valores por defecto del servidor, que es la vista que ya le gustaba.

`test/plugin.test.mjs` fija las dos cosas: que con servidor propio y `device: "tv"` la dirección lleva el
ajuste, y que sin `device` (celular) **no** lo lleva.

**`imageSize=large` no compensa por defecto**: son 1,3 MB por imagen contra 222 KB, para una tele que casi
siempre es 1080p. Va detrás de la opción "Muy grandes", que lo dice en la etiqueta.

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
