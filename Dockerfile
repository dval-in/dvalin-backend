FROM node:bookworm as builder

COPY . /

RUN npm install && \
    npm run build


FROM gcr.io/distroless/nodejs20-debian12:nonroot

COPY --from=builder dist /
WORKDIR /

EXPOSE 3000
CMD ["main.js"]