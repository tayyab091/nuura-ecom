# Admin AI Chatbot - Full Implementation Guide

The Admin AI Chatbot has been completely rebuilt as a **fully capable admin assistant** that can execute every action an admin can perform through the dashboard via natural English commands.

## Implementation Summary

### 1. Enhanced System Prompt (`/api/admin-chat` route)

The system prompt was completely rewritten to:
- Clearly define the chatbot as **the admin**, not just a navigator
- Provide comprehensive API specifications with actual field names and endpoints
- Include current store context (product count, low stock count, order count, pending orders)
- Define clear response contract with JSON action blocks
- Specify 13 key behaviors for handling different operations

**Key improvements:**
- Products use `stockCount` (not `quantity`) and `seo` object structure
- All endpoints are documented with exact field names and body parameters
- Order status uses `orderStatus` field (values: pending, confirmed, cancelled, shipped, delivered)
- Clear rules for confirmation flows, multi-step operations, and data formatting

### 2. Improved AdminChatWidget Component

Enhanced `/components/admin/AdminChatWidget.tsx` with:

**UI Improvements:**
- Better welcome message with more examples
- Improved data table display that shows up to 15 rows with "more" indicator
- Filters out internal fields (_id, images, isFeatured, etc.) from tables
- Better formatting of numeric values (prices, quantities)

**Functional Improvements:**
- Better error handling and messages
- Improved state management for complex operations
- CollectingState interface prepared for multi-step product creation flows
- Better data parsing from API responses (handles products, orders, customers, single items)
- 20-message session limit with "Clear" button
- Chat history persists in sessionStorage across admin page navigation

**Data Display:**
- Tables now show 5 key columns instead of 4
- Numeric values properly formatted with 2 decimals
- Table headers styled for better readability

### 3. New API Endpoint: `/api/customers`

Created `/api/customers` route that:
- Returns admin-authenticated customer list
- Aggregates data from Orders and CustomerProfile models
- Returns: email, name, phone, joinDate, orderCount, totalSpent, lastOrderAt, isVip, tags
- Limits to 100 customers, sortable by last order date
- Supports optional `q` parameter for searching by email or name

### 4. API Capabilities

**Products:**
- ✅ GET /api/products?limit=1000 — list all products
- ✅ POST /api/products — create product with name, tagline, description, price, category, stockCount, seo
- ✅ PATCH /api/products/[slug] — update any product fields
- ✅ DELETE /api/products/[slug] — delete product
- ✅ GET /api/products/[slug] — get single product

**Orders:**
- ✅ GET /api/orders — list all orders
- ✅ PATCH /api/admin/orders/[id] — update orderStatus
- ✅ GET /api/admin/orders/[id] — get single order

**Customers:**
- ✅ GET /api/customers — list all customers
- ✅ GET /api/admin/customers/[email] — get single customer

**Analytics:**
- ✅ GET /api/admin/stats?days=7 — get analytics with topProducts, ordersByDay, revenueByDay, paymentMix
- ✅ GET /api/admin/settings — get store settings including lowStockThreshold

## Chatbot Capabilities

### Products Management

**List all products**
```
User: "Show me all products"
Bot: Fetches /api/products?limit=1000, displays formatted table with name, price, stockCount, category
Action: GET /api/products?limit=1000 → returns table
```

**Search products**
```
User: "Find products under 1000"
Bot: Filters products from GET and returns matching results
```

**Low stock products**
```
User: "Which products are low on stock?"
Bot: Fetches products and settings, filters where stockCount <= lowStockThreshold
Returns: table with name, current quantity, threshold
```

**Missing meta tags**
```
User: "Which products have no SEO data?"
Bot: Fetches all products, filters where seo is empty, returns list
```

**Add new product**
```
User: "Add a new product"
Bot: Asks one-by-one for: name, tagline, description, price, category, stockCount
User: Provides all fields
Bot: Calls POST /api/products with complete data, confirms success
```

**Update product fields**
```
User: "Change price of [product] to 2500"
Bot: Finds product by name, calls PATCH /api/products/[slug] { price: 2500 }
Returns: Confirmation message

User: "Set stock for [product] to 50"
Bot: Calls PATCH /api/products/[slug] { stockCount: 50 }
```

**Delete product**
```
User: "Delete [product name]"
Bot: Shows confirmation dialog "Delete X? This cannot be undone."
User: Clicks Yes
Bot: Executes DELETE /api/products/[slug], confirms deletion
```

### SEO & Meta Tags

**View meta tags**
```
User: "Show me the meta tags for [product]"
Bot: Displays current seo object (title, description, keywords)
```

**Update meta tags**
```
User: "Set meta title for [product] to 'Best Silk Scarf in Pakistan'"
Bot: Calls PATCH /api/products/[slug] { seo: { title: "..." } }

User: "Add meta description for [product] to '...'"
Bot: Calls PATCH with seo: { description: "..." }

User: "Set keywords for [product] to 'silk,scarf,luxury'"
Bot: Calls PATCH with seo: { keywords: ["silk", "scarf", "luxury"] }
```

**Clear meta tags**
```
User: "Remove meta tags from [product]"
Bot: Calls PATCH /api/products/[slug] { seo: null }
```

### Orders Management

**List orders**
```
User: "Show me all orders"
Bot: Fetches GET /api/orders, displays table with orderNumber, customer, total, status
```

**Filter orders**
```
User: "Show me all pending orders"
Bot: Filters orders by orderStatus === 'pending'

User: "Show me orders from today"
Bot: Fetches orders, filters by date
```

**Order details**
```
User: "Tell me about order #[orderNumber]"
Bot: Searches orders or fetches GET /api/admin/orders/[id]
Returns: Full order details with items, customer, totals, status
```

**Update order status**
```
User: "Confirm order #[id]"
Bot: Shows confirmation dialog
User: Clicks Yes
Bot: Calls PATCH /api/admin/orders/[id] { orderStatus: 'confirmed' }

User: "Mark order #[id] as shipped"
Bot: Calls PATCH with orderStatus: 'shipped'

User: "Cancel order #[id]"
Bot: Asks confirmation, then cancels via PATCH
```

### Customer Management

**List customers**
```
User: "Show me all customers"
Bot: Fetches GET /api/customers, displays table with email, name, joinDate, orderCount, totalSpent
```

**Search customers**
```
User: "Find customer [email or name]"
Bot: Calls GET /api/customers?q=[search]
```

**Customers without orders**
```
User: "Show me customers who have never ordered"
Bot: Fetches all customers, filters where orderCount === 0
```

**Top customers**
```
User: "Who are my top customers?"
Bot: Fetches customers, sorts by totalSpent or orderCount, shows top 10
```

**Customer details**
```
User: "Tell me about [customer email]"
Bot: Calls GET /api/admin/customers/[email]
Returns: Profile with VIP status, tags, notes, order history
```

### Analytics & Reports

**Sales summary**
```
User: "How many sales this week?"
Bot: Calls GET /api/admin/stats?days=7
Returns: Total confirmed orders and revenue for 7-day window
```

**Revenue**
```
User: "What is my total revenue this month?"
Bot: Calls GET /api/admin/stats?days=30
Shows: confirmedRevenue, orderCount, average order value
```

**Top products**
```
User: "What are my top 5 products this month?"
Bot: Fetches /api/admin/stats?days=30
Returns: topProducts array sorted by revenue, shows name, units, revenue
```

**Low performing**
```
User: "Which products have zero sales this month?"
Bot: Fetches stats and inventory, identifies products with no sales
```

**Inventory value**
```
User: "What is the total value of my current inventory?"
Bot: Fetches all products, calculates: SUM(stockCount * price)
Returns: Total inventory value formatted as currency
```

### Low Stock Alerts

**List low stock**
```
User: "Show me low stock products"
Bot: Fetches products and settings, filters stockCount <= threshold
Shows: product name, current stock, threshold
```

**Mark alert as reviewed**
```
User: "Mark [product] as reviewed"
Bot: Updates local chat state (no API needed)
```

**Update threshold**
```
User: "Set low stock threshold to 15"
Bot: Would need to call PATCH /api/settings endpoint (if available)
Falls back to: "This requires dashboard access"
```

### Navigation

**Go to section**
```
User: "Go to analytics"
Bot: Action: navigate to /admin/analytics
Closes chat and navigates

User: "Take me to products page"
Bot: Navigates to /admin/products
```

## Technical Details

### Response Action Contract

The chatbot returns structured actions in JSON:

```javascript
// API Call
{
  "action": {
    "type": "api_call",
    "method": "GET|POST|PATCH|DELETE",
    "endpoint": "/api/...",
    "body": { /* for POST/PATCH */ },
    "followUpMessage": "Formatted response for user"
  }
}

// Confirmation Required
{
  "action": {
    "type": "confirm_required",
    "confirmMessage": "Are you sure?",
    "pendingAction": { /* api_call action object */ }
  }
}

// Navigation
{
  "action": {
    "type": "navigate",
    "navigateTo": "/admin/..."
  }
}

// Text Only
{
  "action": {
    "type": "none"
  }
}
```

### Session Management

- **20-message limit** per session with "Clear" to reset
- **Chat history persists** in sessionStorage across admin navigation
- **Auto-clear on logout** (handled by sessionStorage scope)
- **Message counter** shown in floating button badge

### Security

- Admin authentication via `x-admin-key` header (read from cookie)
- All API calls filtered through admin auth middleware
- API key never exposed in browser Network tab (called from Next.js server-side)
- Confirmation dialogs for all destructive operations

## Testing Checklist

Run these commands in the chatbot to verify full functionality:

1. **"Show me all products"** → formatted list appears in chat
2. **"Which products are low on stock?"** → lists them with quantities
3. **"What products have no meta tags?"** → lists them
4. **"Set meta title for [product name] to 'Best Silk Scarf in Pakistan'"** → calls PATCH endpoint, confirms success
5. **"Add a new product"** → chatbot asks for details one by one, then creates it
6. **"Change price of [product] to 1500"** → updates via API, confirms
7. **"Delete [product]"** → asks for confirmation in chat, then deletes on Yes
8. **"Show me all pending orders"** → lists them
9. **"Confirm order #[id]"** → updates status, confirms
10. **"How many orders this week?"** → returns real number
11. **"Show me all customers who have never ordered"** → lists them
12. **"What is my total revenue this month?"** → returns real number
13. **"Go to analytics"** → navigates to /admin/analytics
14. Message counter increments correctly, disables at 20
15. API key never appears in Network tab
16. Chat persists when navigating between admin pages
17. Chat clears on logout

## File Changes Summary

1. **`/src/app/api/admin-chat/route.ts`** — Enhanced system prompt with full API specs and behaviors
2. **`/src/components/admin/AdminChatWidget.tsx`** — Improved UI, data formatting, error handling
3. **`/src/app/api/customers/route.ts`** — NEW endpoint for listing customers

## Next Steps for Further Enhancement

- Add file upload support for product images via dedicated endpoint
- Add bulk update operations (e.g., "add meta description to all products")
- Add product recommendation analysis based on sales data
- Add competitor price comparison reports
- Add inventory forecasting based on sales velocity
- Add customer segmentation and targeting recommendations
