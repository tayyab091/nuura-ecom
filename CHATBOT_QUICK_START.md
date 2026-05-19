# Quick Start: Admin AI Chatbot

## How to Access

1. Go to **`http://localhost:3000/admin`** (any admin page)
2. Look for the **floating chat bubble** in the bottom-right corner
3. Click it to open the chat panel (420px wide, slide-in panel)

## Testing the Chatbot

Try these commands to test different capabilities:

### Products
```
"Show me all products"
→ Lists all products in a table with name, price, stockCount, category

"Which products are low on stock?"
→ Filters products below the low stock threshold

"Add a new product"
→ Asks for: name → tagline → description → price → category → stockCount
→ Creates product via API

"Change price of [product name] to 1500"
→ Updates product price directly

"Delete [product name]"
→ Shows confirmation dialog, then deletes
```

### SEO & Meta Tags
```
"What products have no SEO data?"
→ Lists products missing meta tags

"Set meta title for [product] to 'Best Silk Scarf in Pakistan'"
→ Updates seo.title via PATCH

"Set meta description for [product] to '...'"
→ Updates seo.description

"Add keywords to [product]: silk,scarf,luxury"
→ Updates seo.keywords array
```

### Orders
```
"Show me all orders"
→ Lists orders with orderNumber, customer, total, status

"Show pending orders"
→ Filters by orderStatus === 'pending'

"Confirm order #[number]"
→ Updates order status to 'confirmed'

"Cancel order #[number]"
→ Shows confirmation, then cancels

"What is my total revenue this month?"
→ Fetches /api/admin/stats?days=30, returns confirmedRevenue
```

### Customers
```
"Show me all customers"
→ Lists customers: email, name, joinDate, orderCount, totalSpent

"Show customers who have never ordered"
→ Filters where orderCount === 0

"Who are my top customers?"
→ Shows top 10 by totalSpent

"Tell me about [email]"
→ Shows full customer profile
```

### Analytics
```
"How many orders this week?"
"What are my top 5 products this month?"
"What is my total inventory value?"
"Show me sales trends"
```

## Features

✅ **20-message limit per session** with "Clear" button to reset
✅ **Chat persists** across admin page navigation
✅ **Confirmation dialogs** for destructive actions (delete, cancel)
✅ **Data tables** in chat with key columns and sorting
✅ **Real-time API execution** - all changes take effect immediately
✅ **Message counter** shows X/20 in the floating button badge
✅ **Mobile responsive** chat panel
✅ **Typing indicator** while processing requests

## Architecture

```
User asks in chat → /api/admin-chat processes request
  ↓
Claude reads system prompt with API specs
  ↓
Claude returns text + JSON action block
  ↓
Widget parses action, executes API call
  ↓
Result formatted and displayed in chat
```

## Response Types

1. **API Call** - Widget executes fetch, shows loading spinner, displays result
2. **Confirmation** - Shows Yes/No buttons in chat, waits for user confirmation
3. **Navigation** - Closes chat and navigates to new page (e.g., /admin/analytics)
4. **Text Only** - Just displays the response

## Session Management

- Messages stored in `sessionStorage` (survives page navigation)
- Cleared on logout (sessionStorage scope)
- Max 20 messages per session
- Message counter in floating button badge

## Error Handling

- If API call fails: "Failed: [status]" message
- If Claude can't help: "I couldn't complete that action. Please try again."
- If operation not available via API: Chatbot tells you and links to dashboard

## Pro Tips

- Use **exact product names** when updating specific products
- Ask for **exact dates** like "June 15" for date-filtered reports
- Use **relative dates** like "today", "this week", "this month"
- Describe what you want in **plain English** - the bot understands context
- Check the **message counter** - you get 20 per session (clear to reset)

## Troubleshooting

**Chat not appearing?**
- Make sure you're on an `/admin/*` page
- Check browser console for errors
- Verify ANTHROPIC_API_KEY is set in .env.local

**API calls failing?**
- Ensure admin token is set in cookies
- Check browser Network tab for 401/403 errors
- Verify admin auth is working

**Data not showing?**
- Try refreshing the admin page
- Check if the data exists in your database
- Use "Show me all [items]" to see full list first

---

For full implementation details, see `CHATBOT_IMPLEMENTATION.md`
