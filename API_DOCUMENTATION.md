# Smart Finance Tracker - API Documentation

## Overview

Smart Finance Tracker uses Supabase as its backend, which provides auto-generated REST APIs for database tables. This document covers the available API operations and authentication.

## Base URL

```
https://your-project-id.supabase.co/rest/v1
```

Replace `your-project-id` with your actual Supabase project ID.

## Authentication

All API requests require authentication using JWT tokens. The Supabase client handles this automatically, but for direct API calls:

**Headers Required:**
```
apikey: your_supabase_anon_key
Authorization: Bearer user_jwt_token
Content-Type: application/json
```

## Authentication APIs

### 1. Sign Up

Create a new user account.

**Endpoint:** `POST /auth/v1/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

**Using Supabase Client:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword123'
});
```

### 2. Sign In

Authenticate an existing user.

**Endpoint:** `POST /auth/v1/token?grant_type=password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (Success):**
```json
{
  "access_token": "jwt_token",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Using Supabase Client:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword123'
});
```

### 3. Sign Out

End the user's session.

**Endpoint:** `POST /auth/v1/logout`

**Using Supabase Client:**
```typescript
const { error } = await supabase.auth.signOut();
```

## Categories API

### 1. Get All Categories

Fetch all categories (default + user's custom categories).

**Endpoint:** `GET /rest/v1/categories`

**Query Parameters:**
- `select=*` - Select all fields
- `order=name.asc` - Order by name ascending

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Salary",
    "type": "income",
    "icon": "banknote",
    "color": "#10B981",
    "is_default": true,
    "user_id": null,
    "created_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": "uuid",
    "name": "Food & Dining",
    "type": "expense",
    "icon": "utensils",
    "color": "#EF4444",
    "is_default": true,
    "user_id": null,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**Using Supabase Client:**
```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .order('name');
```

### 2. Get Categories by Type

Filter categories by income or expense.

**Endpoint:** `GET /rest/v1/categories?type=eq.income`

**Using Supabase Client:**
```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('type', 'income')
  .order('name');
```

### 3. Create Custom Category

Add a custom category for the user.

**Endpoint:** `POST /rest/v1/categories`

**Request Body:**
```json
{
  "name": "Freelance Projects",
  "type": "income",
  "icon": "briefcase",
  "color": "#8B5CF6",
  "user_id": "user_uuid"
}
```

**Response:**
```json
{
  "id": "new_uuid",
  "name": "Freelance Projects",
  "type": "income",
  "icon": "briefcase",
  "color": "#8B5CF6",
  "is_default": false,
  "user_id": "user_uuid",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Using Supabase Client:**
```typescript
const { data, error } = await supabase
  .from('categories')
  .insert({
    name: 'Freelance Projects',
    type: 'income',
    icon: 'briefcase',
    color: '#8B5CF6',
    user_id: user.id
  })
  .select()
  .single();
```

## Transactions API

### 1. Get All Transactions

Fetch all transactions for the authenticated user.

**Endpoint:** `GET /rest/v1/transactions`

**Query Parameters:**
- `select=*,categories(*)` - Include category details
- `order=date.desc` - Order by date descending

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "user_uuid",
    "title": "Monthly Salary",
    "amount": 5000.00,
    "type": "income",
    "category_id": "category_uuid",
    "date": "2024-01-15",
    "notes": "January 2024 salary",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z",
    "categories": {
      "id": "category_uuid",
      "name": "Salary",
      "type": "income",
      "icon": "banknote",
      "color": "#10B981"
    }
  }
]
```

**Using Supabase Client:**
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select('*, categories(*)')
  .order('date', { ascending: false });
```

### 2. Get Transaction by ID

Fetch a specific transaction.

**Endpoint:** `GET /rest/v1/transactions?id=eq.{transaction_id}`

**Using Supabase Client:**
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select('*, categories(*)')
  .eq('id', transactionId)
  .maybeSingle();
```

### 3. Create Transaction

Add a new transaction.

**Endpoint:** `POST /rest/v1/transactions`

**Request Body:**
```json
{
  "user_id": "user_uuid",
  "title": "Grocery Shopping",
  "amount": 150.75,
  "type": "expense",
  "category_id": "category_uuid",
  "date": "2024-01-20",
  "notes": "Weekly groceries"
}
```

**Response:**
```json
{
  "id": "new_uuid",
  "user_id": "user_uuid",
  "title": "Grocery Shopping",
  "amount": 150.75,
  "type": "expense",
  "category_id": "category_uuid",
  "date": "2024-01-20",
  "notes": "Weekly groceries",
  "created_at": "2024-01-20T14:30:00Z",
  "updated_at": "2024-01-20T14:30:00Z"
}
```

**Using Supabase Client:**
```typescript
const { data, error } = await supabase
  .from('transactions')
  .insert({
    user_id: user.id,
    title: 'Grocery Shopping',
    amount: 150.75,
    type: 'expense',
    category_id: categoryId,
    date: '2024-01-20',
    notes: 'Weekly groceries'
  })
  .select()
  .single();
```

### 4. Update Transaction

Modify an existing transaction.

**Endpoint:** `PATCH /rest/v1/transactions?id=eq.{transaction_id}`

**Request Body:**
```json
{
  "title": "Updated Grocery Shopping",
  "amount": 175.50,
  "notes": "Updated amount"
}
```

**Using Supabase Client:**
```typescript
const { data, error } = await supabase
  .from('transactions')
  .update({
    title: 'Updated Grocery Shopping',
    amount: 175.50,
    notes: 'Updated amount'
  })
  .eq('id', transactionId)
  .select()
  .single();
```

### 5. Delete Transaction

Remove a transaction.

**Endpoint:** `DELETE /rest/v1/transactions?id=eq.{transaction_id}`

**Using Supabase Client:**
```typescript
const { error } = await supabase
  .from('transactions')
  .delete()
  .eq('id', transactionId);
```

### 6. Filter Transactions by Date Range

Get transactions within a specific date range.

**Endpoint:** `GET /rest/v1/transactions?date=gte.2024-01-01&date=lte.2024-01-31`

**Using Supabase Client:**
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select('*, categories(*)')
  .gte('date', '2024-01-01')
  .lte('date', '2024-01-31')
  .order('date', { ascending: false });
```

### 7. Filter Transactions by Type

Get only income or expense transactions.

**Endpoint:** `GET /rest/v1/transactions?type=eq.income`

**Using Supabase Client:**
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select('*, categories(*)')
  .eq('type', 'income')
  .order('date', { ascending: false });
```

### 8. Get Transactions by Category

Fetch all transactions for a specific category.

**Endpoint:** `GET /rest/v1/transactions?category_id=eq.{category_id}`

**Using Supabase Client:**
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select('*, categories(*)')
  .eq('category_id', categoryId)
  .order('date', { ascending: false });
```

## Aggregation Queries

### Calculate Total Balance

```typescript
const { data: transactions } = await supabase
  .from('transactions')
  .select('amount, type');

const income = transactions
  .filter(t => t.type === 'income')
  .reduce((sum, t) => sum + Number(t.amount), 0);

const expense = transactions
  .filter(t => t.type === 'expense')
  .reduce((sum, t) => sum + Number(t.amount), 0);

const balance = income - expense;
```

### Get Monthly Summary

```typescript
const startOfMonth = new Date();
startOfMonth.setDate(1);
const endOfMonth = new Date();
endOfMonth.setMonth(endOfMonth.getMonth() + 1);
endOfMonth.setDate(0);

const { data } = await supabase
  .from('transactions')
  .select('amount, type')
  .gte('date', startOfMonth.toISOString().split('T')[0])
  .lte('date', endOfMonth.toISOString().split('T')[0]);
```

## Error Handling

All API calls may return errors. Always check for errors in responses:

**Error Response Format:**
```json
{
  "error": {
    "message": "Error message",
    "code": "error_code",
    "details": "Additional details"
  }
}
```

**Common Error Codes:**
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Server Error

**Example Error Handling:**
```typescript
const { data, error } = await supabase
  .from('transactions')
  .insert({ /* data */ });

if (error) {
  console.error('Error:', error.message);
  // Handle error appropriately
} else {
  console.log('Success:', data);
}
```

## Rate Limiting

Supabase free tier includes:
- 500 MB database storage
- 1 GB file storage
- 2 GB bandwidth
- 50,000 monthly active users

For production applications, consider upgrading to a paid plan for higher limits.

## Security Best Practices

1. **Never expose your service_role_key** - Only use the anon/public key in client-side code
2. **Always use Row Level Security (RLS)** - Already configured in this application
3. **Validate user input** - Both client-side and server-side
4. **Use HTTPS** - Supabase enforces this automatically
5. **Implement proper error handling** - Don't expose sensitive information in error messages

## Postman Collection

You can import the following examples into Postman for testing:

### Environment Variables
```
SUPABASE_URL: https://your-project-id.supabase.co
SUPABASE_ANON_KEY: your_anon_key
ACCESS_TOKEN: user_jwt_token (obtained after login)
```

### Example Requests

**1. Sign Up:**
- Method: POST
- URL: `{{SUPABASE_URL}}/auth/v1/signup`
- Headers: `apikey: {{SUPABASE_ANON_KEY}}`
- Body: `{"email": "test@example.com", "password": "password123"}`

**2. Get Transactions:**
- Method: GET
- URL: `{{SUPABASE_URL}}/rest/v1/transactions?select=*,categories(*)`
- Headers:
  - `apikey: {{SUPABASE_ANON_KEY}}`
  - `Authorization: Bearer {{ACCESS_TOKEN}}`

**3. Create Transaction:**
- Method: POST
- URL: `{{SUPABASE_URL}}/rest/v1/transactions`
- Headers:
  - `apikey: {{SUPABASE_ANON_KEY}}`
  - `Authorization: Bearer {{ACCESS_TOKEN}}`
  - `Content-Type: application/json`
- Body:
```json
{
  "title": "Test Transaction",
  "amount": 100,
  "type": "expense",
  "category_id": "category_uuid",
  "date": "2024-01-20"
}
```

## Real-time Subscriptions

Supabase supports real-time updates. Subscribe to changes:

```typescript
const channel = supabase
  .channel('transactions-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'transactions',
      filter: `user_id=eq.${user.id}`
    },
    (payload) => {
      console.log('Change received!', payload);
      // Update UI accordingly
    }
  )
  .subscribe();

// Unsubscribe when done
channel.unsubscribe();
```

## Additional Resources

- Supabase Documentation: https://supabase.com/docs
- REST API Reference: https://supabase.com/docs/reference/javascript/introduction
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
