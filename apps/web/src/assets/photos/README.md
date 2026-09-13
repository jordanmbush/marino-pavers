# Static photos

The pictures the prerendered pages use: `hero.jpg` on the home page and one
per service, named by the service's id and referenced from
`src/content/services.json`. Astro crops and resizes them at build, so a
page never reads the photo manifest and never breaks when the client rotates
or deletes a photo in `/admin`.

Each is one of the client's own photos from the production library
(`originals/<id>.jpg` in the production media bucket), resized to fit
2048px with EXIF rotation applied:

| File                  | Library id         |
| --------------------- | ------------------ |
| `hero.jpg`            | `1c44107ab2254706` |
| `paver-patios.jpg`    | `4b89bf11406d47f7` |
| `driveways.jpg`       | `0b6df4e337954131` |
| `artificial-turf.jpg` | `e15902f781d74637` |
| `pool-decks.jpg`      | `d122923faa4c4542` |
| `walkways.jpg`        | `8c539278f7db4c0a` |
| `outdoor-living.jpg`  | `7c3dd5666ffd4e03` |

To swap one, pick an id from `https://marinopavers.com/media/manifest.json`,
fetch the original with the `marino-pavers` profile and resize it:

```js
sharp(original)
  .rotate()
  .resize({ width: 2048, height: 2048, fit: "inside" })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile("hero.jpg");
```
