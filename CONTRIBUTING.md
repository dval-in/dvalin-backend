# Contributing

1. [Fork the repository](https://help.github.com/articles/fork-a-repo/)
2. Install dependencies (pnpm install)
3. Create your feature branch (git checkout -b my-new-feature)
4. Commit your changes (git commit -am 'Added some feature')
5. Push to the branch (git push origin my-new-feature)
6. [Create new Pull Request](https://help.github.com/articles/creating-a-pull-request/)

## Code Style

We use eslint, prettier and svelte-check to maintain code style and best practices. Please make sure your PR adheres to
the guides by running: `pnpm run lint`

## Commit messages

Commit messages should follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) guidelines

## File structure

```sh
dvalin-backend
├─ .dockerignore
├─ .prettierignore
├─ CONTRIBUTING.md
├─ Dockerfile
├─ README.md
├─ commitlint.config.cjs
├─ eslint.config.js
├─ nodemon.json
├─ package.json
├─ pnpm-lock.yaml
├─ prettier.config.js
├─ prisma
│  ├─ migrations
│  └─ schema.prisma
├─ src
│  ├─ config
│  │  ├─ config.ts
│  │  └─ redis.config.ts
│  ├─ db
│  │  ├─ models
│  │  │  ├─ achievements.ts
│  │  │  ├─ auth.ts
│  │  │  ├─ character.ts
│  │  │  ├─ config.ts
│  │  │  ├─ genshinAccount.ts
│  │  │  ├─ user.ts
│  │  │  ├─ weapons.ts
│  │  │  └─ wishes.ts
│  │  └─ prismaClient.ts
│  ├─ global.d.ts
│  ├─ handlers
│  │  ├─ BKTree.ts
│  │  ├─ response.handler.ts
│  │  ├─ user
│  │  │  ├─ achievements.handler.ts
│  │  │  ├─ characters.handler.ts
│  │  │  ├─ weapons.handler.ts
│  │  │  └─ wishes.handler.ts
│  │  ├─ userProfile
│  │  │  ├─ achievements.handler.ts
│  │  │  ├─ characters.handler.ts
│  │  │  ├─ weapons.handler.ts
│  │  │  └─ wishes.handler.ts
│  │  ├─ websocket
│  │  │  ├─ achievement.handler.ts
│  │  │  └─ websocket.handler.ts
│  │  └─ wish
│  │     ├─ characters.handler.ts
│  │     └─ weapons.handler.ts
│  ├─ main.ts
│  ├─ queues
│  │  ├─ syncUserProfile.queue.ts
│  │  └─ wish.queue.ts
│  ├─ routes
│  │  ├─ auth
│  │  │  ├─ auth.routes.ts
│  │  │  ├─ githubOAuth.route.ts
│  │  │  ├─ googleOAuth.route.ts
│  │  │  └─ microsoftOAuth.route.ts
│  │  ├─ character
│  │  │  └─ character.routes.ts
│  │  ├─ data
│  │  │  └─ data.routes.ts
│  │  ├─ user
│  │  │  └─ user.routes.ts
│  │  ├─ weapon
│  │  │  └─ weapon.routes.ts
│  │  └─ wish
│  │     └─ wish.routes.ts
│  ├─ services
│  │  ├─ auth.service.ts
│  │  ├─ character.service.ts
│  │  ├─ data.service.ts
│  │  ├─ userProfile.service.ts
│  │  ├─ weapon.service.ts
│  │  ├─ websocket.service.ts
│  │  └─ wish.service.ts
│  ├─ types
│  │  ├─ frontend
│  │  │  ├─ achievement.ts
│  │  │  ├─ artifact.ts
│  │  │  ├─ character.ts
│  │  │  ├─ config.ts
│  │  │  ├─ dvalinFile.ts
│  │  │  ├─ furnishing.ts
│  │  │  ├─ material.ts
│  │  │  ├─ user.ts
│  │  │  ├─ weapon.ts
│  │  │  └─ wish.ts
│  │  └─ models
│  │     ├─ auth.ts
│  │     ├─ dataIndex.ts
│  │     ├─ fileReference.ts
│  │     ├─ github.ts
│  │     ├─ language.ts
│  │     ├─ queue.ts
│  │     ├─ sendResponse.ts
│  │     ├─ websocket.ts
│  │     └─ wish.ts
│  ├─ utils
│  │  ├─ errors.ts
│  │  ├─ github.ts
│  │  ├─ hoyolab.ts
│  │  ├─ levenshteinDistance.ts
│  │  ├─ log.ts
│  │  ├─ passport.ts
│  │  └─ session.ts
│  └─ worker
│     ├─ userProfileSync.worker.ts
│     ├─ wish.worker.ts
│     └─ worker.ts
└─ tsconfig.json
```

### `config`

This directory contains configuration files for the application. It includes environment-specific settings, such as general configurations and Redis configurations.

### `db`

This directory includes all database-related files and models.

### `models`

Contains Prisma models representing the various entities in the application, such as users, characters, achievements, and more.

-   **`prismaClient.ts`**: Initializes and exports the Prisma client to be used across the application for database operations.
-   **`global.d.ts`**: Contains global TypeScript declarations that can be accessed throughout the application.

### `handlers`

This directory contains handlers responsible for processing specific functionalities and data operations.

-   **`user`**: Handlers for user-related operations like achievements, characters, weapons, and wishes.
-   **`userProfile`**: Handlers for user profile-related operations.
-   **`websocket`**: Handlers for WebSocket events and operations.
-   **`wish`**: Handlers for wish-related operations.
-   **`main.ts`**: The main entry point of the application, where the Express app is configured and started.

### `queues`

Contains queue configurations and implementations using BullMQ. Queues are used for managing background tasks and operations.

-   **`syncUserProfile.queue.ts`**: Queue for syncing user profiles.
-   **`wish.queue.ts`**: Queue for handling wish-related tasks.

### `routes`

Defines the application's API routes. Each subdirectory corresponds to a specific feature or entity.

-   **`auth`**: Routes for authentication, including OAuth handlers for GitHub, Google, and Microsoft.
-   **`character`**: Routes related to character operations.
-   **`data`**: Routes for fetching dynamic data.
-   **`user`**: Routes related to user operations.
-   **`weapon`**: Routes related to weapon operations.
-   **`wish`**: Routes related to wish operations.

### `services`

Contains business logic and service classes. These services are responsible for the core functionality of the application, interacting with the database, and processing data.

-   **`auth.service.ts`**: Handles authentication logic.
-   **`character.service.ts`**: Manages character-related logic.
-   **`data.service.ts`**: Handles operations related to dynamic data.
-   **`userProfile.service.ts`**: Manages user profile operations.
-   **`weapon.service.ts`**: Manages weapon-related logic.
-   **`websocket.service.ts`**: Handles WebSocket connections and events.
-   **`wish.service.ts`**: Manages wish-related logic.

### `types`

Contains TypeScript type definitions used throughout the application.

-   **`frontend`**: Types used in the frontend interactions.
-   **`models`**: Types representing various data models and structures, such as authentication, data index, file references, GitHub data, languages, queues, response formats, WebSocket events, and wishes.

### `utils`

Utility functions and helpers used across the application.

-   **`errors.ts`**: Custom error classes and utilities.
-   **`github.ts`**: Functions for interacting with GitHub APIs.
-   **`hoyolab.ts`**: Functions for interacting with Hoyolab API.
-   **`levenshteinDistance.ts`**: Implementation of the Levenshtein distance algorithm.
-   **`log.ts`**: Logging utilities.
-   **`passport.ts`**: Passport.js setup for authentication.
-   **`session.ts`**: Session management setup using Express session and Prisma session store.

### `worker`

Worker processes for background tasks. These are scripts that run independently to handle long-running tasks or operations that don't need to be executed immediately.

-   **`userProfileSync.worker.ts`**: Worker for syncing user profiles.
-   **`wish.worker.ts`**: Worker for processing wish-related tasks.
-   **`worker.ts`**: General worker setup and initialization.
