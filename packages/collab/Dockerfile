# syntax=docker/dockerfile:1
FROM node:24.21.0-alpine

WORKDIR /app

COPY ../../package-lock.json ./
COPY ../../package.json ./
COPY ../../packages/collab/package.json ./packages/collab/

RUN --mount=type=cache,target=/root/.npm \
  npm ci

COPY ../../packages/collab/server.js ./packages/collab/

EXPOSE 1234
VOLUME /data

WORKDIR /app/packages/collab
CMD ["npm", "start"]
