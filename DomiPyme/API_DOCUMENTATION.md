# DomiPyme API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:8000/api/v1/`  
**Authentication:** JWT (SimpleJWT with token rotation)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Accounts](#accounts)
3. [Shops](#shops)
4. [Products](#products)
5. [Orders](#orders)
6. [Error Responses](#error-responses)

---

## Authentication

DomiPyme uses JWT authentication with access/refresh token pairs. Access tokens expire in 15 minutes, refresh tokens in 7 days.

### Headers

For authenticated requests, include the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Token Rotation

When a refresh token is used, a new refresh token is issued and the old one is blacklisted.

---

## 1. Authentication Endpoints

### 1.1. Register User

**POST** `/api/v1/auth/register/`

Creates a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "re_password": "SecurePass123!",
  "is_merchant": false
}
```

**Success Response (201 Created):**

```json
{
  "id": 1,
  "email": "user@example.com",
  "is_merchant": false,
  "is_staff": false,
  "is_superuser": false,
  "is_active": true
}
```

**Error Response (400 Bad Request):**

```json
{
  "password": ["Las contraseñas no coinciden."],
  "email": ["Este email ya está registrado."]
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "re_password": "SecurePass123!",
    "is_merchant": true
  }'
```

---

### 1.2. Login (Obtain Token Pair)

**POST** `/api/v1/auth/login/`

Authenticates a user and returns access/refresh tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200 OK):**

```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401 Unauthorized):**

```json
{
  "detail": "No active account found with the given credentials"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

---

### 1.3. Refresh Token

**POST** `/api/v1/auth/refresh/`

Refreshes an access token using a valid refresh token. Returns new access + refresh tokens (rotation).

**Request Body:**

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**

```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401 Unauthorized):**

```json
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

### 1.4. Password Reset Request

**POST** `/api/v1/auth/password-reset/`

Sends a password reset email with uid and token.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**

```json
{
  "detail": "Si el correo existe, se ha enviado un enlace de restablecimiento."
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/password-reset/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

### 1.5. Password Reset Confirm

**POST** `/api/v1/auth/password-reset-confirm/`

Confirms password reset using uid, token, and new password.

**Request Body:**

```json
{
  "uidb64": "MQ",
  "token": "c3j8xa-47f7e8b2d9c3a8f1b2e5d8c9a7f4b6e1",
  "new_password": "NewSecurePass123!"
}
```

**Success Response (200 OK):**

```json
{
  "detail": "Contraseña restablecida correctamente."
}
```

**Error Response (400 Bad Request):**

```json
{
  "detail": "El token es inválido o ha expirado."
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/password-reset-confirm/ \
  -H "Content-Type: application/json" \
  -d '{
    "uidb64": "MQ",
    "token": "c3j8xa-47f7e8b2d9c3a8f1b2e5d8c9a7f4b6e1",
    "new_password": "NewSecurePass123!"
  }'
```

---

## 2. Shops Endpoints

### 2.1. List Shops

**GET** `/api/v1/shops/`

Returns a list of all active shops. Public endpoint (no authentication required).

**Query Parameters:**

- `search` (optional): Search by name or description
- `is_active` (optional): Filter by active status (true/false)

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "My Shop",
    "slug": "my-shop",
    "description": "Best shop ever",
    "owner": 2,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

**cURL Example:**

```bash
curl -X GET http://localhost:8000/api/v1/shops/
```

---

### 2.2. Create Shop

**POST** `/api/v1/shops/`

Creates a new shop. **Requires authentication** (merchant user).

**Request Body:**

```json
{
  "name": "New Shop",
  "slug": "new-shop",
  "description": "Shop description"
}
```

**Success Response (201 Created):**

```json
{
  "id": 2,
  "name": "New Shop",
  "slug": "new-shop",
  "description": "Shop description",
  "owner": 3,
  "is_active": true,
  "created_at": "2024-01-16T14:20:00Z",
  "updated_at": "2024-01-16T14:20:00Z"
}
```

**Error Response (403 Forbidden):**

```json
{
  "detail": "You do not have permission to perform this action."
}
```

**Error Response (400 Bad Request):**

```json
{
  "slug": ["shop with this slug already exists."]
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:8000/api/v1/shops/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Store",
    "slug": "tech-store",
    "description": "Electronics and gadgets"
  }'
```

---

### 2.3. Retrieve Shop

**GET** `/api/v1/shops/{id}/`

Returns details of a specific shop. Public endpoint.

**Success Response (200 OK):**

```json
{
  "id": 1,
  "name": "My Shop",
  "slug": "my-shop",
  "description": "Best shop ever",
  "owner": 2,
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "products": [
    {
      "id": 5,
      "name": "Product A",
      "price": "19.99",
      "stock": 100
    }
  ]
}
```

**cURL Example:**

```bash
curl -X GET http://localhost:8000/api/v1/shops/1/
```

---

### 2.4. Update Shop

**PATCH** `/api/v1/shops/{id}/`

Updates a shop. **Requires authentication** (owner or admin).

**Request Body:**

```json
{
  "description": "Updated description",
  "is_active": true
}
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "name": "My Shop",
  "slug": "my-shop",
  "description": "Updated description",
  "owner": 2,
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-16T15:45:00Z"
}
```

**Error Response (403 Forbidden):**

```json
{
  "detail": "You do not have permission to perform this action."
}
```

**cURL Example:**

```bash
curl -X PATCH http://localhost:8000/api/v1/shops/1/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated shop info"
  }'
```

---

### 2.5. Delete Shop

**DELETE** `/api/v1/shops/{id}/`

Deletes a shop. **Requires authentication** (owner or admin).

**Success Response (204 No Content):**

(No body)

**Error Response (403 Forbidden):**

```json
{
  "detail": "You do not have permission to perform this action."
}
```

**cURL Example:**

```bash
curl -X DELETE http://localhost:8000/api/v1/shops/1/ \
  -H "Authorization: Bearer <access_token>"
```

---

## 3. Products Endpoints

### 3.1. List Products

**GET** `/api/v1/products/`

Returns a list of products. Public endpoint.

**Query Parameters:**

- `shop` (optional): Filter by shop ID
- `search` (optional): Search by name or description
- `min_price` (optional): Minimum price filter
- `max_price` (optional): Maximum price filter

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "Product A",
    "description": "Great product",
    "price": "29.99",
    "stock": 150,
    "shop": 1,
    "created_at": "2024-01-15T11:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  }
]
```

**cURL Example:**

```bash
curl -X GET "http://localhost:8000/api/v1/products/?shop=1"
```

---

### 3.2. Create Product

**POST** `/api/v1/products/`

Creates a new product. **Requires authentication** (shop owner).

**Request Body:**

```json
{
  "name": "New Product",
  "description": "Product description",
  "price": "49.99",
  "stock": 50,
  "shop": 1
}
```

**Success Response (201 Created):**

```json
{
  "id": 2,
  "name": "New Product",
  "description": "Product description",
  "price": "49.99",
  "stock": 50,
  "shop": 1,
  "created_at": "2024-01-16T16:00:00Z",
  "updated_at": "2024-01-16T16:00:00Z"
}
```

**Error Response (403 Forbidden):**

```json
{
  "detail": "You do not have permission to perform this action."
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:8000/api/v1/products/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High performance laptop",
    "price": "999.99",
    "stock": 20,
    "shop": 1
  }'
```

---

### 3.3. Retrieve Product

**GET** `/api/v1/products/{id}/`

Returns details of a specific product. Public endpoint.

**Success Response (200 OK):**

```json
{
  "id": 1,
  "name": "Product A",
  "description": "Great product",
  "price": "29.99",
  "stock": 150,
  "shop": 1,
  "created_at": "2024-01-15T11:00:00Z",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

**cURL Example:**

```bash
curl -X GET http://localhost:8000/api/v1/products/1/
```

---

### 3.4. Update Product

**PATCH** `/api/v1/products/{id}/`

Updates a product. **Requires authentication** (shop owner or admin).

**Request Body:**

```json
{
  "price": "39.99",
  "stock": 200
}
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "name": "Product A",
  "description": "Great product",
  "price": "39.99",
  "stock": 200,
  "shop": 1,
  "created_at": "2024-01-15T11:00:00Z",
  "updated_at": "2024-01-16T17:30:00Z"
}
```

**Error Response (403 Forbidden):**

```json
{
  "detail": "You do not have permission to perform this action."
}
```

**cURL Example:**

```bash
curl -X PATCH http://localhost:8000/api/v1/products/1/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "price": "34.99"
  }'
```

---

### 3.5. Delete Product

**DELETE** `/api/v1/products/{id}/`

Deletes a product. **Requires authentication** (shop owner or admin).

**Success Response (204 No Content):**

(No body)

**Error Response (403 Forbidden):**

```json
{
  "detail": "You do not have permission to perform this action."
}
```

**cURL Example:**

```bash
curl -X DELETE http://localhost:8000/api/v1/products/1/ \
  -H "Authorization: Bearer <access_token>"
```

---

## 4. Orders Endpoints

### 4.1. List Orders

**GET** `/api/v1/orders/`

Returns a list of orders for the authenticated user. **Requires authentication**.

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "user": 3,
    "status": "pending",
    "total": "79.98",
    "created_at": "2024-01-16T10:00:00Z",
    "items": [
      {
        "product": 1,
        "quantity": 2,
        "price": "39.99"
      }
    ]
  }
]
```

**cURL Example:**

```bash
curl -X GET http://localhost:8000/api/v1/orders/ \
  -H "Authorization: Bearer <access_token>"
```

---

### 4.2. Create Order

**POST** `/api/v1/orders/`

Creates a new order. **Requires authentication**.

**Request Body:**

```json
{
  "items": [
    {
      "product": 1,
      "quantity": 2
    },
    {
      "product": 3,
      "quantity": 1
    }
  ]
}
```

**Success Response (201 Created):**

```json
{
  "id": 2,
  "user": 3,
  "status": "pending",
  "total": "119.97",
  "created_at": "2024-01-16T18:00:00Z",
  "items": [
    {
      "product": 1,
      "quantity": 2,
      "price": "39.99"
    },
    {
      "product": 3,
      "quantity": 1,
      "price": "39.99"
    }
  ]
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product": 1, "quantity": 2}
    ]
  }'
```

---

## 5. Error Responses

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid data or validation error |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource does not exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |

### Example Error Response

```json
{
  "detail": "Authentication credentials were not provided."
}
```

### Validation Error Example

```json
{
  "email": ["This field is required."],
  "password": ["This password is too short. It must contain at least 8 characters."]
}
```

---

## Rate Limiting

- **Anonymous users:** 20 requests per minute
- **Authenticated users:** 120 requests per minute

**Rate Limit Exceeded Response (429):**

```json
{
  "detail": "Request was throttled. Expected available in 45 seconds."
}
```

---

## Testing Authentication Flow

**1. Register:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "re_password": "TestPass123!",
    "is_merchant": true
  }'
```

**2. Login:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

**3. Create Shop (using access token from login):**

```bash
curl -X POST http://localhost:8000/api/v1/shops/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Shop",
    "slug": "test-shop",
    "description": "My first shop"
  }'
```

**4. Create Product:**

```bash
curl -X POST http://localhost:8000/api/v1/products/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "My first product",
    "price": "19.99",
    "stock": 100,
    "shop": 1
  }'
```

---

## Notes

- All timestamps are in UTC format (ISO 8601)
- Prices are decimal strings with 2 decimal places
- Slugs must be unique and URL-safe
- Email addresses are case-insensitive
- Passwords must meet Django's password validation requirements (min 8 characters, not too common, etc.)
