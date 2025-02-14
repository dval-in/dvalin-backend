FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update -y \
&& apt-get install -y openssl
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base
COPY --from=dependencies /app/node_modules /app/node_modules
EXPOSE 3000
CMD [ "sh", "-c", "pnpm run db:generate && pnpm start" ]