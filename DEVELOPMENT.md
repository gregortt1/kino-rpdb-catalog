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

**Idioma.** TMDB no tiene `es-CO`, así que en español se pide `es-MX` y en inglés `en-US`. Los textos que
arma el código (títulos de fila, `userMessage`) sí siguen `kino.lang`, que en Kino es `es-CO` o `en-US`.

**`meta` reutiliza la misma clave y la misma sonda** que el catálogo, así que no hay dos comprobaciones.

## Lo que no está verificado

Conviene tenerlo presente antes de tocar nada:

1. **Nunca se probó con una clave real de RPDB** (quien escribió esto no tiene suscripción). Lo
   verificado contra la API real es la sonda (`HEAD` → `403` sin cuerpo; ninguna redirección, por eso
   basta declarar un host) y que la dirección que arma el plugin es la que RPDB entiende. El camino con
   clave válida está sin estrenar.
2. **Los ids de TMDB de película y de serie son espacios distintos** y pueden coincidir en el mismo
   número. RPDB resuelve un id suelto consultando **ambos** y quedándose con el más popular (verificado
   en el código de `openposterdb`, el reemplazo open-source), así que una colisión rara podría dar el
   póster equivocado. La salida está en la interfaz: **Fuente del póster ▸ TMDB**.
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
