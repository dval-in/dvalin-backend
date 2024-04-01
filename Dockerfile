FROM node:bookworm

COPY . /
WORKDIR /

RUN npm install

EXPOSE 3000
CMD npm run start