# INE Product Price Tracker

A full-stack product price tracking application built for the INE
Software Engineer Intern assignment.

The application lets users:

-   Search products from the INE mock store.
-   Select products to track.
-   View current price and stock information.
-   View price history.
-   View detailed scraper attempt logs.
-   Run reliable scheduled scraping with retries and failure handling.

## Live Deployment

-   Frontend: **Vercel**
-   Backend API: **Render**
-   Database: **Supabase PostgreSQL**
-   Scheduler: **cron-job.org**

> Add the final Vercel URL here before submission.

**Frontend:** `<VERCEL_URL>`

**Backend:** https://ine-scraper-q6o6.onrender.com

------------------------------------------------------------------------

## Architecture

``` text
                    ┌──────────────────┐
                    │   React Frontend │
                    │     (Vercel)     │
                    └────────┬─────────┘
                             │ REST API
                             ▼
                    ┌──────────────────┐
                    │ Node.js / Express│
                    │     (Render)     │
                    └───────┬──────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        Supabase        Playwright     Scraper API
        PostgreSQL       Chromium       /internal/scrape
             ▲              │
             │              ▼
             │       INE Mock Store
             │
             └──── Price History
                 & Scrape Logs

cron-job.org
      │
      │ every 2 hours
      ▼
POST /api/internal/scrape
```

------------------------------------------------------------------------

## Tech Stack

### Frontend

-   React
-   Vite
-   JavaScript
-   CSS

### Backend

-   Node.js
-   Express
-   Playwright
-   Supabase JavaScript client
-   CORS
-   dotenv

### Infrastructure

-   Vercel --- frontend deployment
-   Render --- backend deployment
-   Supabase --- PostgreSQL database
-   cron-job.org --- external scraper scheduling

------------------------------------------------------------------------

## Project Structure

``` text
INE_SCRAPER/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── queries.js
│   │   │   └── supabase.js
│   │   ├── routes/
│   │   │   ├── products.js
│   │   │   ├── trackedProducts.js
│   │   │   └── internal.js
│   │   └── scraper/
│   │       ├── productScraper.js
│   │       ├── retry.js
│   │       └── runScraper.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── ...
│   ├── package.json
│   └── .env
│
└── README.md
```

------------------------------------------------------------------------

## How It Works

### 1. Product Search

The frontend sends a search request to:

``` text
GET /api/products/search?q=<query>
```

The backend searches the INE mock store catalog and returns matching
products.

### 2. Track a Product

When a user selects a product:

``` text
POST /api/tracked-products
```

The backend stores the product's:

-   External product ID
-   Product name
-   Product URL
-   SKU

Duplicate products are not tracked again.

### 3. Scraping

For each active tracked product, the scraper:

1.  Opens the product page using Playwright.
2.  Handles the cookie overlay when it appears.
3.  Performs the required browser interaction.
4.  Checks whether the **Reveal Price** button is available.
5.  Clicks the button.
6.  Waits for the dynamically rendered price.
7.  Extracts the current price and stock status.
8.  Validates the result.
9.  Stores a successful observation in price history.

The mock store uses browser-side behavior and delayed/dynamic content,
so browser automation is used instead of relying only on lightweight
HTTP requests.

### 4. Retries

Each product gets up to **3 scrape attempts**.

``` text
Attempt 1
   │
   ├── success ──► save price history
   │
   └── failure
          │
          ▼
      Attempt 2
          │
          ├── success ──► save price history
          │
          └── failure
                 │
                 ▼
             Attempt 3
                 │
                 ├── success ──► save price history
                 │
                 └── failure ──► log failure only
```

A failed scrape does **not** create an invalid price-history record.

The scraper then continues with the next tracked product.

### 5. Logging

Every scraper attempt is stored in `scrape_logs`.

Each attempt records:

-   Attempt number
-   Status
-   Timestamp
-   Error message when applicable
-   Response time

Possible statuses:

-   `success`
-   `retried`
-   `failed`

This keeps scraper history honest even when a product cannot be scraped
successfully.

------------------------------------------------------------------------

## Database Design

The application uses three main tables.

### `tracked_products`

Stores the products being monitored.

``` text
id
external_id
product_name
product_url
sku
is_active
created_at
```

### `price_history`

Stores only valid successful observations.

``` text
id
tracked_product_id
price
stock_status
scraped_at
```

### `scrape_logs`

Stores every scrape attempt.

``` text
id
tracked_product_id
attempt_number
status
error_message
response_time_ms
attempted_at
```

Relationship:

``` text
tracked_products
      │
      ├──────────► price_history
      │
      └──────────► scrape_logs
```

------------------------------------------------------------------------

## API Endpoints

  Method   Endpoint                              Description
  -------- ------------------------------------- -----------------------------
  `GET`    `/api/products/search?q=...`          Search products
  `GET`    `/api/tracked-products`               Get active tracked products
  `POST`   `/api/tracked-products`               Track a product
  `GET`    `/api/tracked-products/:id/history`   Get price history
  `GET`    `/api/tracked-products/:id/logs`      Get scrape logs
  `POST`   `/api/internal/scrape`                Trigger the scraper

The internal scraper endpoint is protected using the `x-scraper-secret`
request header.

Example:

``` http
POST /api/internal/scrape
x-scraper-secret: <SCRAPER_SECRET>
```

------------------------------------------------------------------------

## Scheduling

The backend is deployed on Render's free tier, so an external scheduler
is used instead of relying on an in-process timer.

**cron-job.org** triggers:

``` text
POST https://ine-scraper-q6o6.onrender.com/api/internal/scrape
```

The job is configured to run every **2 hours**.

The backend then:

1.  Loads all active tracked products.
2.  Scrapes each product.
3.  Retries failed attempts.
4.  Saves successful price/stock observations.
5.  Records every attempt in the scrape logs.

------------------------------------------------------------------------

## Environment Variables

### Backend

Create `backend/.env` locally:

``` env
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
SCRAPER_SECRET=<your-scraper-secret>
```

The Supabase service-role key must only be used on the backend and must
never be exposed to the frontend.

### Frontend

Create `frontend/.env` locally:

``` env
VITE_API_URL=http://localhost:3000/api
```

For the deployed frontend:

``` env
VITE_API_URL=https://ine-scraper-q6o6.onrender.com/api
```

Do not commit `.env` files.

------------------------------------------------------------------------

## Local Development

### Backend

``` bash
cd backend
npm install
npx playwright install chromium
npm start
```

The backend runs on:

``` text
http://localhost:3000
```

### Frontend

``` bash
cd frontend
npm install
npm run dev
```

The Vite development server will provide the local frontend URL.

------------------------------------------------------------------------

## Running the Scraper Manually

The scraper can be triggered through the protected API endpoint:

``` http
POST http://localhost:3000/api/internal/scrape
```

with:

``` http
x-scraper-secret: <SCRAPER_SECRET>
```

This is useful for testing retries, failures, and database logging
without waiting for the scheduled cron execution.

------------------------------------------------------------------------

## Headed Scraper Mode

The scraper can also be run in headed browser mode for debugging and
demonstration.

This makes the Playwright browser visible and allows the browser
interaction with the mock store to be observed directly.

Use the project's scraper runner in headed mode when recording the
required demonstration video.

------------------------------------------------------------------------

## Reliability Considerations

The scraper was designed around the behavior observed in the mock store
rather than assuming that a normal HTTP request would always be
sufficient.

Important cases handled include:

-   Cookie overlays intercepting clicks.
-   The Reveal Price button temporarily being disabled.
-   Price content appearing after a delay.
-   Transient request failures.
-   Slow browser interactions.
-   Formatted prices containing whitespace and separators.
-   Complete scrape failure after all retry attempts.

The scraper only writes to `price_history` after obtaining a valid
observation. Failed attempts are represented in `scrape_logs` instead.

The current implementation processes products sequentially. This keeps
browser sessions and retries isolated and avoids unnecessary concurrent
load on the mock store. If the number of tracked products grows
substantially, a bounded worker pool could be introduced to process
several products concurrently while keeping concurrency controlled.

------------------------------------------------------------------------

## Deployment

### Backend --- Render

The Render service uses:

``` text
Root Directory: backend
Build Command: npm install && npx playwright install chromium
Start Command: npm start
```

Required backend environment variables are configured in Render.

### Frontend --- Vercel

The Vercel project uses:

``` text
Root Directory: frontend
```

and the frontend environment variable:

``` env
VITE_API_URL=https://ine-scraper-q6o6.onrender.com/api
```

### Database --- Supabase

Supabase PostgreSQL stores:

-   Tracked products
-   Price history
-   Scrape logs

### Scheduler --- cron-job.org

cron-job.org sends the authenticated POST request every two hours.

------------------------------------------------------------------------

## Testing

The application was tested through:

-   Local scraper runs.
-   Postman API requests.
-   Production Render deployment.
-   Cron-job.org scheduled executions.
-   Multiple tracked products in a single run.
-   Retry scenarios.
-   Persistent scrape failures.
-   Price history and scrape-log verification.

The scraper has been observed to successfully recover from transient
product-level failures while continuing to process subsequent products.

------------------------------------------------------------------------

## Security

-   Backend secrets are stored in environment variables.
-   `.env` files are excluded from Git.
-   The internal scraper endpoint requires `x-scraper-secret`.
-   The Supabase service-role key is never sent to the frontend.

------------------------------------------------------------------------

## Future Improvements

Possible extensions include:

-   Bounded concurrent scraper workers for larger product sets.
-   Configurable scraping frequency.
-   Price-change notifications.
-   Multi-product price comparison/dashboard improvements.
-   More detailed failure classification and monitoring.
-   Automated CI/CD tests.

------------------------------------------------------------------------

## Assignment Deliverables

-   Live frontend deployment
-   Public GitHub repository
-   Screen recording of the scraper running in headed mode
-   README with setup, scheduling, and environment variables
-   Design and engineering note
-   Resume PDF
