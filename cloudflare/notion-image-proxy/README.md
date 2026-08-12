# Notion image proxy

Cloudflare Worker proxy for NotionNext images.

## Deploy

1. Copy `wrangler.toml.example` to `wrangler.toml`.
2. Replace `img.example.com` with your image domain.
3. Deploy:

```bash
npx wrangler deploy
```

The API token needs at least Workers Scripts edit access for the account. Custom
domain binding also needs access to the `tangly1024.com` zone.

4. Set NotionNext env:

```env
NEXT_PUBLIC_NOTION_HOST=https://cdn.tangly1024.com
```

## Verify

```bash
curl -I "https://img.example.com/images/page-cover/gradients_11.jpg"
```

Expected headers after repeat requests:

```text
X-Notion-Image-Proxy: 1
CF-Cache-Status: HIT
Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable
ETag: W/"..."
```

The image URL contains Notion's attachment identifier, so replacing an image
produces a new URL. The proxy can therefore cache successful image responses in
the browser and at Cloudflare's edge for one year. It also handles conditional
requests with `ETag` or `Last-Modified`, returning `304 Not Modified` without an
image body when a client explicitly revalidates a cached image.
