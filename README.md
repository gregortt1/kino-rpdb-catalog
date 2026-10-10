# Catálogo con pósters RPDB — plugin de Kino

Un catálogo de **TMDB** (tendencias, mejor valoradas, en cines, búsqueda) cuyos pósters vienen de
**[RatingPosterDB](https://ratingposterdb.com/)**. Además rellena el póster que le falte a un título de
tus **otras** fuentes.

`id` del plugin: `rpdb-catalog` · `apiVersion` 6 (necesita **Kino 0.9.50** o superior) · no reproduce nada.

---

## Por qué este sí y el plugin `meta` no

Kino elige la imagen de un título en este orden y se queda con la **primera**:

```
el título de su propio plugin  →  details  →  AniList  →  plugins "meta"
```

Un plugin `meta` va el último y solo puede **rellenar huecos**. Aquí, en cambio, el póster de RPDB es
**el póster del propio ítem**, así que gana siempre y se ve donde tiene que verse: en la ficha y en las
miniaturas de Inicio, búsqueda y "Ver más".

Eso sí, ojo con lo que esto es y lo que no es:

- ✅ **Es una fuente más en Kino.** Aparece con sus propias filas de Inicio y su propia búsqueda, y sus
  pósters llevan la nota.
- ❌ **No reemplaza los pósters de tus otras fuentes.** Los títulos de otro plugin siguen con su arte;
  este catálogo solo aporta los suyos (y, de regalo, rellena el hueco cuando un título ajeno no trae
  póster ninguno).

Como el plugin es de **solo catálogo**, sus títulos no se reproducen: al abrirlos, Kino los manda a
**"Buscar dónde verlo"**, donde busca en tus demás fuentes con el `ids.tmdb` que cada ítem lleva. Es un
catálogo para descubrir, no un reproductor.

## No necesitas llave de TMDB

Kino pone la suya a través de `kino.tmdb` (Kino 0.9.53+), detrás de su propia caché y sus propios
límites, así que este plugin **no lleva ninguna llave de TMDB** ni declara su host para eso. El ajuste
`tmdbKey` existe solo para Kino 0.9.52 y anteriores, donde esa puerta todavía no existía.

## La llave de RPDB es tuya y es opcional

- **Sin clave**, el catálogo funciona igual con los pósters originales de TMDB. Instálalo y pruébalo
  antes de pagar nada.
- **Con clave**, los pósters pasan a ser los de RPDB. La clave va dentro de la URL de cada imagen, y un
  plugin de Kino es código público, así que va en un ajuste `password` **tuyo**, nunca en el repositorio
  (los sellos de Kino son ofuscación: *"la clave privada que abre un sello va dentro de cada copia de
  Kino"*). Tampoco vale una clave compartida por todos los usuarios: se agotaría y RPDB la daría de baja.

La clave se comprueba **una vez por sesión** con una petición `HEAD` (RPDB contesta `403` sin cuerpo
cuando no vale). Si te equivocaste al escribirla, **el plugin se da cuenta y usa los pósters de TMDB**
en vez de dejar cientos de imágenes rotas.

---

## Instalarlo

1. En Kino: **Ajustes ▸ Plugins** (en el televisor: menú ☰ → Plugins → **+**).
2. Escribe `TU-USUARIO-DE-GITHUB/kino-rpdb-catalog` y oprime **Agregar**.
3. Lee la hoja y **Instalar**. Va a decir que el plugin **usa tu usuario y contraseña** (son las claves,
   guardadas cifradas en el aparato).
4. **Configurar**:
   - **Clave de RPDB**: opcional. Sin ella, pósters de TMDB.
   - **Fuente del póster**: `RatingPosterDB` (con nota) o `TMDB` (los originales).
   - **Tipo de póster**: `poster-default`, o el tipo con nota que incluya tu tier.
   - **Póster sin nota si no hay con nota**: encendido. Evita imágenes rotas.
   - **Usar fondos con nota**: apagado. Los fondos con nota son del tier 3 de RPDB.
   - **Llave de TMDB**: solo si tu Kino es 0.9.52 o anterior.
5. Abre el Inicio: verás las filas del catálogo con el nombre del plugin.

## Dos cosas que no pude comprobar, dichas claras

1. **Nunca lo probé con una clave real de RPDB**, porque no tengo suscripción. Lo que sí está
   comprobado contra la API real: que responde `403` a `HEAD` sin cuerpo (por eso la sonda funciona) y
   que **no redirige** (por eso basta declarar un host). Cuando pongas tu clave, mira una ficha y
   confirma que el póster llega.
2. **Los ids de TMDB de película y de serie son espacios distintos** y pueden coincidir en el mismo
   número. RPDB resuelve un id suelto consultando **ambos** y quedándose con el más popular (lo verifiqué
   en el código de su reemplazo open-source), así que una colisión rara podría dar el póster equivocado.
   Si alguna vez ves uno mal, pon **Fuente del póster ▸ TMDB** y vuelves a los originales.

Un detalle menor: el idioma de TMDB se pide como `es-MX` cuando Kino está en español (`es-CO` no es uno
de los idiomas de TMDB) y como `en-US` cuando está en inglés. Los títulos de las filas y el mensaje de
"solo catálogo" sí siguen `kino.lang`, en español o en inglés.

---

## Probarlo en tu computador

Node 18 o más nuevo. Todo es offline: `kino.tmdb` y `kino.fetch` están simulados, así que no hace falta
ninguna llave.

```bash
node sdk/validate.mjs .      # ¿lo instalaría Kino? -> "✓ Kino would accept this plugin"
node test/plugin.test.mjs    # 14 pruebas, sin red
```

La suite cubre: las filas del Inicio y sus pósters de RPDB, que el catálogo funcione **sin** clave, el
cambio a pósters de TMDB, que una clave rechazada no deje imágenes rotas (y que solo se pruebe una vez),
la paginación de `browse` y `search`, que un ref hostil no llegue a TMDB, los capítulos con sus
especiales descartados, el relleno por `meta`, los títulos de fila en inglés, el `resolve` de solo
catálogo y que el archivo no use nada que QuickJS no tenga.

## Publicarlo

1. Repositorio **público y nuevo** con estos archivos en la raíz. **No uses Fork**: Kino deja los forks
   fuera de "De la comunidad".
2. Antes de subirlo, cambia en `kino-plugin.json` `"author"` y `"homepage"` (tienen
   `TU-USUARIO-DE-GITHUB`).
3. Pon el topic **`kino-plugin`** y una descripción en el repositorio (About → ⚙).
4. Sube `"version"` en cada cambio: Kino solo instala una actualización si el número es mayor.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `kino-plugin.json` | Manifiesto: hosts, capacidades, ajustes. |
| `plugin.js` | La pasarela a TMDB, el catálogo, los pósters y el relleno por `meta`. |
| `icon.png` | El ícono (512×512, 20 KB; el tope son 128 KB). |
| `sdk/` | El kit de pruebas de Kino, copiado de la plantilla oficial. |
| `test/plugin.test.mjs` | Las pruebas. |
| `contract.json`, `kino.d.ts` | El contrato de Kino y los tipos. |

## Créditos

Sin afiliación con RatingPosterDB, TMDB ni Kino. Los datos y las imágenes son de TMDB a través de Kino;
los pósters con nota, de RPDB con tu clave. Respeta los términos de ambos y no compartas tu clave.
