# MiniShop Frontend

React + Vite storefront for MiniShop.

## Local development

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

The development API URL is configured in `.env` as:

```env
VITE_API_URL=http://localhost:5000
```

Cloudinary credentials are intentionally not used in this frontend. Product images are selected in the admin UI and uploaded through the protected Express API.
