# WifakBank Dashboard Client

A connected application that accepts **JWT SSO** from the main `WifakBankProject` portal.  
No login page — the user arrives via a signed token in the URL and is immediately authenticated.

---

## Architecture

```
WifakBankProject (4200/8080)
        │  opens new tab with ?token=<JWT>
        ▼
WifakBank-Dashboard-Client
   Angular (4201)  →  Spring Boot (8082)
        │               │
        │  POST /api/auth/validate
        │               │
        │  GET /api/dashboard/data
        ▼               ▼
   Dashboard UI    Oracle XE (1521)
```

---

## Project Structure

```
WifakBank-Dashboard-Client/
├── backend/                          # Spring Boot 3 application
│   ├── pom.xml
│   └── src/main/java/com/wifakbank/dashboardclient/
│       ├── DashboardClientApplication.java
│       ├── config/SecurityConfig.java
│       ├── filter/JwtAuthenticationFilter.java
│       ├── controller/
│       │   ├── AuthController.java
│       │   └── DashboardController.java
│       ├── service/JwtService.java
│       └── dto/
│           ├── UserInfoDto.java
│           └── DashboardDataDto.java
│
└── frontend/                         # Angular 18 standalone application
    ├── package.json
    ├── proxy.conf.json               # Dev proxy → http://localhost:8082
    └── src/app/
        ├── app.component.ts          # Token extraction from URL
        ├── app.config.ts             # HttpClient + interceptor setup
        ├── app.routes.ts             # Lazy-loaded dashboard route
        ├── core/
        │   ├── services/
        │   │   ├── auth.service.ts   # Token store + validation
        │   │   └── dashboard.service.ts
        │   ├── interceptors/auth.interceptor.ts
        │   └── guards/auth.guard.ts
        └── features/
            └── dashboard/dashboard.component.ts
```

---

## Getting Started

### Prerequisites
- Java 17+, Maven 3.8+
- Node 20+, Angular CLI 18+
- Oracle XE running on `localhost:1521`

### 1. Oracle DB Setup

```sql
CREATE USER dashboard_client_user IDENTIFIED BY dashboard_client_password;
GRANT CONNECT, RESOURCE TO dashboard_client_user;
GRANT UNLIMITED TABLESPACE TO dashboard_client_user;
```

Flyway runs the schema migration automatically on first startup (`V1__init_dashboard_client.sql`).

### 2. Backend

```bash
cd backend

# Use the same JWT_SECRET as WifakBankProject!
set JWT_SECRET=your-256-bit-secret-key-for-wifakbank-dashboard

mvn spring-boot:run
```

Backend starts on **http://localhost:8082**

### 3. Frontend

```bash
cd frontend
npm install
ng serve --port 4201
```

Frontend starts on **http://localhost:4201**

> The `proxy.conf.json` forwards all `/api` calls to `http://localhost:8082` during development,
> so no CORS issues when running locally.

---

## Integration with WifakBankProject (Main Portal)

### 1. Add the application to the database

```sql
INSERT INTO APPLICATIONS (ID, NAME, URL, ACTIVE)
VALUES (APPLICATIONS_SEQ.NEXTVAL, 'Dashboard Client', 'http://localhost:4201', 1);

INSERT INTO APPLICATION_ROLES (ID, APPLICATION_ID, ROLE_CODE)
VALUES (APP_ROLES_SEQ.NEXTVAL,
        (SELECT ID FROM APPLICATIONS WHERE NAME = 'Dashboard Client'),
        'USER');
```

### 2. Open the app from the main portal

In the main portal's dashboard component, the "Open Application" button should pass the token:

```typescript
openApplication(app: any) {
  const token = this.authService.getToken();
  window.open(`${app.url}?token=${token}`, '_blank');
}
```

---

## SSO Flow

1. User logs in to `WifakBankProject` at `http://localhost:4200` (with 2FA if configured).
2. User clicks "Dashboard Client" — main portal opens `http://localhost:4201?token=<JWT>`.
3. Angular `AppComponent` reads `?token=` from the URL, strips it from history, and calls `AuthService.setToken()`.
4. `AuthService` hits `GET /api/auth/validate` (public endpoint) — Spring Boot verifies the JWT signature and expiry.
5. On success, user info is stored in an Angular signal and the router navigates to `/dashboard`.
6. All subsequent API calls include the token via `authInterceptor`.
7. On logout, session storage is cleared and the browser is redirected to `http://localhost:4200/login`.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `your-256-bit-secret-key...` | **Must match** WifakBankProject's secret |
| `server.port` | `8082` | Backend port |

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/auth/validate` | Public | Validates JWT, returns user info |
| GET | `/api/dashboard/data` | Bearer JWT | Returns dashboard statistics |
