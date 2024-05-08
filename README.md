# Dvalin - Backend

### How to use

#### Requirements:

-   [Node 20](https://nodejs.org/)
-   [Pnpm 9](https://pnpm.io/)
-   [PostgreSQL](https://www.postgresql.org/)
-   [Redis](https://www.redis.io/)
-   Oauth Tokens: (Redirect URL needs to match BACKEND_URL in .env)
    -   [Github](https://github.com/settings/developers)
    -   Optional: Google
    -   Optional: Microsoft

#### Steps:

1. [Clone the repository](https://docs.github.com/articles/cloning-a-repository)
2. Install dependencies (`pnpm install`)
3. Create a copy of .env.example named .env
4. Fill in all variables in .env
5. Push prisma schema to database (`prisma db push`)
6. Run backend (`pnpm run dev`)

### Contributing

See [CONTRIBUTING.md](https://github.com/dval-in/dvalin-backend/blob/main/CONTRIBUTING.md)
