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
| `kino.tmdb` | La puerta de Kino a TMDB (Kino 0.9.53+). **El plugin no lleva ninguna llave de TMDB** y no declara `api.themoviedb.org` para eso. |
| `posterServer()` | La base de las imágenes: el servidor que escriba la persona, o RatingPosterDB. Ver más abajo. |

El `tmdbKey` del manifiesto y la entrada `api.themoviedb.org` en `hosts` existen **solo** para Kino
0.9.52 y anteriores, donde `kino.tmdb` no existe todavía y hay que ir por `kino.fetch` con la llave de la
persona.

## Probarlo en local

Node 18 o más nuevo. Todo es offline: `kino.tmdb` y `kino.fetch` están simulados en las pruebas, así que
no hace falta ninguna llave.

```bash
node sdk/validate.mjs .      # ¿lo instalaría Kino? -> "✓ Kino would accept this plugin"
node test/plugin.test.mjs    # 14 pruebas, sin red
```

`sdk/run.mjs` sirve para probar funciones sueltas contra TMDB de verdad, pero necesita una llave:
ponla en la variable `KINO_TMDB_KEY` o en `"tmdbKey"` dentro de `sdk/config.json` (el kit no tiene la
llave de Kino, así que ahí sí hace falta una).

## Decisiones de diseño

**La comprobación de la clave de RPDB.** Un póster roto en cada título es un fallo muy visible, así que
la clave se comprueba una vez por sesión con una petición `HEAD`. Comprobado contra la API real: RPDB
contesta `403` **sin cuerpo** a una clave inválida, así que la sonda no descarga ninguna imagen. Solo un
`401`/`403` cuenta como veredicto: un `404`, un `5xx`, un `405` (RPDB sin `HEAD`) o un fallo de red no
dicen nada sobre la clave y las respuestas salen igual. Si la clave se rechaza, `usesRpdb()` empieza a
devolver falso y todo el catálogo cae a los pósters de TMDB.

**RPDB solo con arte de TMDB.** RPDB construye sus pósters sobre el arte de TMDB, así que un título con
`poster_path` es uno que RPDB puede servir. Un título sin arte propio se deja en blanco en vez de
arriesgar una imagen genérica.

**Fondos.** Con `withBackdrop` apagado, el `backdrop` es el de TMDB y el `poster` el de RPDB: así el
póster con nota no cuesta dos peticiones a RPDB.

**El tipo de medio va dentro del id (`movie-603`, `series-1399`).** Este fue un fallo real y conviene no
repetirlo. Los ids de TMDB de película y de serie son **listas distintas que colisionan**: el número 1399
existe como serie (Juego de tronos) y puede existir como película. La URL de RPDB es
`/{clave}/{id_type}/{tipo}/{id}.jpg`, así que un número pelado obliga a RPDB a **adivinar** entre los dos
espacios, y adivina **por popularidad**: el título más popular gana y el resto recibe el póster de otro
título o ninguno.

Se vio en la app antes de entenderlo: una serie mostraba el cartel de una película alemana de los años 30
y tres series más salían en blanco, mientras que Spider-Man y Ted Lasso (muy populares) salían bien. La
documentación de la API de `openposterdb` —reemplazo *drop-in* de RPDB, mismo esquema de URL— lo dice
explícitamente: para `id_type: tmdb`, `id_value` es del tipo `movie-123` o `series-456`. IMDb no lo
necesita: `tt0944947` es inequívoco, así que `meta()` los manda sin prefijo.

El ajuste `idMode` (por defecto `typed`) permite volver al número pelado si una versión de RPDB no
aceptara el prefijo. `test/plugin.test.mjs` fija las dos formas.

**El servidor de pósters es configurable.** La base sale de `posterServer()`: el ajuste `url` que escriba
la persona, o RatingPosterDB si está vacío. Es un ajuste `url` a propósito: Kino convierte un servidor
que la persona escribió en un host alcanzable, tanto para `kino.fetch` como para las **imágenes** (el
contrato lo permite expresamente, incluso en la red local y por `http`), así que un OpenPosterDB en casa
o el alojado en `openposterdb.com` funcionan sin declarar ningún host ni pedir permisos nuevos. Las
direcciones son las mismas en ambos servicios —comprobado: `openposterdb.com/{clave}/imdb/poster-default/
{id}.jpg` responde `401 {"error":"Unauthorized"}` con una clave falsa—, así que no hay dos caminos de
código, solo una base distinta.

**Idioma.** TMDB no tiene `es-CO`, así que en español se pide `es-MX` y en inglés `en-US`. Los textos que
arma el código (títulos de fila, `userMessage`) sí siguen `kino.lang`, que en Kino es `es-CO` o `en-US`.

**`meta` reutiliza la misma clave y la misma sonda** que el catálogo, así que no hay dos comprobaciones.

## Lo que no está verificado

Conviene tenerlo presente antes de tocar nada:

1. **Nunca se probó con una clave real de RPDB** (quien escribió esto no tiene suscripción). Lo
   verificado contra la API real es la sonda (`HEAD` → `403` sin cuerpo; ninguna redirección, por eso
   basta declarar un host) y que la dirección que arma el plugin es la que RPDB entiende. El camino con
   clave válida está sin estrenar.
2. **El prefijo `movie-`/`series-` sale de la documentación de la API de `openposterdb`**, el reemplazo
   *drop-in* que usa el mismo esquema de URL que RPDB. No se pudo probar contra la API real de RPDB: hace
   falta una clave de pago, y la comprobación de la clave ocurre **antes** que la del id, así que con una
   clave inválida todas las formas responden `403`. Si el prefijo no se aceptara, el ajuste `idMode`
   devuelve el comportamiento anterior en un toque.
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
