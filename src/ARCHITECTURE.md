# R2Cart Web architecture

## Boundaries

- `assets/`: static brand assets.
- `components/ui.jsx`: shared UI primitives used by customer and admin features.
- `context/`: client-side application state and actions.
- `data/`: mock fixtures split by business domain. No UI component owns catalogue arrays.
- `layouts/`: customer and admin application shells.
- `pages/customer/` and `pages/admin/`: route-level feature views split into focused files, with local helpers kept beside their owning feature.
- `services/`: HTTP data-access boundaries and response normalization for the connected backend.
- `config/`: environment-driven runtime configuration.

## Backend integration

`VITE_API_BASE_URL` points to the Express `/api/v1` API backed by Prisma/MySQL. `httpClient.js` provides JSON handling, structured errors, separate customer/admin authorization and request timeouts. Keep response normalization inside services so UI models remain stable.

## State ownership

Transient UI state stays inside pages/components. `AppContext` holds the customer session and API-loaded catalogue, cart, favourites, addresses, orders and delivery rules. Signed-in mutations persist through authenticated backend services. Local storage is only session/UI caching and guest-cart persistence, not a substitute for MySQL.

## Admin management APIs

The admin navbar uses protected `/admin/search` for product/SKU, order, customer, category and ticket matching. `/admin/notifications` returns actionable pending-order, low-stock and support alerts, honoring saved notification preferences. Counts are calculated from actual returned alerts; read markers are cached locally per browser. Alerts refresh on focus, settings changes and every 60 seconds. The account menu shows the authenticated admin's identity and the saved store logo (not a fabricated personal photo). Local upload URLs resolve against the active API server, including legacy localhost ports. Settings saves identity/operations/preferences without overwriting delivery pricing from a stale page. Support responses and status changes persist under the authenticated admin identity with validation and error/retry states.

Categories, orders, customers, inventory, coupons, banners and delivery use protected `/admin` APIs without mock-data fallback. Failed requests show errors and retry controls. Category/banner reorder saves the complete ID list atomically and rejects stale lists. Categories containing products/subcategories cannot be deleted until those references are removed.

Orders use server-side status filtering and pagination. Detail views load the exact database order with customer contact, saved address snapshot, payment fields, line prices and status history. Status updates are transactional; cancellation restores stock once, concurrent updates return a conflict, and delivered/cancelled orders are terminal. Customer lists contain only customer-role accounts, real saved addresses and order history; spending counts delivered orders. Account enable/disable is persisted.

Inventory saves stock and each product's threshold, preserving the saved threshold when omitted. Coupons validate type, dates, amounts and usage limits; delete and disable are separate operations. Checkout refreshes offers and validates applied codes against the backend after basket changes or window focus.

Delivery locality choices come from saved database zones. Admin can add a locality through the zone form; it is serviceable only after saving an active zone. Zone rules take precedence over store defaults. `/admin/delivery/defaults` updates only delivery fields without overwriting unrelated store settings. Customer catalogue/delivery data refresh on window focus and mutation events; customer orders refresh on focus. Cross-tab updates appear when the customer tab regains focus. No demo catalogue is displayed when the API is unavailable.

Read-only MySQL smoke check: from `R2Cart-Backend`, run `node tests/admin-api.integration-check.js`. This reads all seven management modules without modifying business records.

## Product packs and ratings

Pack sizes are independent sellable products sharing `variantGroupId`. Each pack owns its SKU, unit, price and stock; carts and orders reference that pack's product ID. Admin adds all sizes in the new-product form and publishes them in one save. The backend validates the whole batch and inserts it within one transaction. More packs can be added from the edit screen, and each pack can be edited independently. Catalogue services flatten API variants; customer grids show each pack separately. Card ADD opens a chooser where customers can add either pack or both with independent quantities. Product details already provide pack selection, so their ADD adds the selected pack directly. Existing quantity controllers always adjust that exact pack. Modals render into the document body through a portal, avoiding clipping by card overflow and animated ancestors.

`ProductRating` stores one score per customer and pack. The API only accepts ratings from customers with a delivered order containing that pack. Catalogue responses calculate `rating` and `ratingCount` from saved ratings; unrated products display “No ratings yet”.

## Admin products

The admin catalogue uses protected `/admin/products` and `/admin/products/:id` endpoints, never customer catalogue APIs or mock arrays. Search (name/SKU), category/status/stock filtering, counts and pagination run against MySQL. Low-stock filtering uses each product's saved threshold. Detail previews and editing load by exact product ID, including inactive packs; deleted packs cannot be edited. Categories for listing/forms/bulk templates come from the authenticated admin category API without fixture fallback.

Create, edit, status changes, pack creation, bulk import and deletion persist through backend services. Product forms allow a saved stock-alert threshold. Errors render retry states instead of demo data. Deletion waits for success and supports retries for Cloudinary cleanup failures. The public catalogue cannot expose inactive packs via query parameters.

## Admin dashboard data

`GET /admin/dashboard` is authenticated and returns real MySQL aggregates, charts, stock alerts, recent orders/customers and top sellers. The dashboard never imports demo catalogue/order/customer arrays. It refreshes on window focus and every 60 seconds, with manual refresh, initial skeletons, error/retry and honest empty states.

Reporting boundaries use Asia/Kolkata. Revenue includes only currently delivered orders and is grouped by order creation date, not payment settlement date. Top sellers use delivered orders placed this month and their saved item prices/quantities; item revenue excludes delivery and coupon adjustments. Low-stock counts compare each pack's stock to its own saved threshold. Product totals count all non-deleted sellable packs, including inactive packs.

## Bulk product import workflow

Admin Products → Bulk import (`/admin/products/import`) downloads an Excel template with product columns, instructions and the current category list. Excel (.xlsx) and CSV files are parsed by a lazily loaded frontend service. A row represents one sellable pack; matching Product Group Codes link sizes with the same name and category. Existing name/category/pack combinations are rejected rather than overwritten. Maximum 200 rows per batch.

The preview endpoint (`POST /admin/products/import/preview`) validates rows against MySQL. Image URLs are supported directly; image filenames must match JPG/PNG/WebP files from an optional ZIP (5 MB per image, 50 MB uncompressed total). ZIP images use the existing authenticated Cloudinary upload endpoint before import. Uploaded URLs are retained in page state for retry if an import fails. No automatic sweep of abandoned uploads is performed.

Import (`POST /admin/products/import`) revalidates every submitted row, requires resolved image URLs, and inserts all packs in one database transaction. Automatic SKUs and deterministic import slugs prevent duplicate retry inserts. Invalid rows can be removed explicitly, and errors can be downloaded as CSV. Catalogue services fetch all backend pages so imported products are not hidden by the previous 50-row limit.

## Product image deletion behavior

Admin deletion removes unused store-owned Cloudinary images before archiving the product. References from other non-deleted packs (including inactive packs), category images, banners and the store logo protect shared assets. Provider deletion requests invalidate CDN copies. Failures are surfaced to the admin so the deletion can be retried; already-missing assets are accepted. Historical orders remain in MySQL, but their image URLs may no longer be available after the final listing using an image is deleted. This flow does not sweep assets from products deleted before it was introduced.
