# Price Compare

A standalone, installable unit-price comparison PWA. It compares up to four items using:

`price ÷ quantity = price per unit`

## Run locally

Because service workers require HTTP, serve the folder instead of opening `index.html` directly:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Install on iPhone

After deploying the folder to any HTTPS web host, open its URL in Safari, tap **Share**, then **Add to Home Screen**.
