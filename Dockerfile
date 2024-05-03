FROM node:lts-bookworm

COPY . /
WORKDIR /

RUN npm add -g pnpm && pnpm install

EXPOSE 3000
CMD pnpm run start