# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

COPY ../../package-lock.json ./
COPY ../../package.json ./
COPY ../../packages/collab/package.json ./packages/collab/

RUN --mount=type=cache,target=/root/.npm \
  npm ci

EXPOSE 1234
VOLUME /data

WORKDIR /app/packages/collab
CMD ["npm", "start"]
