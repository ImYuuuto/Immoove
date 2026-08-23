FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY tsconfig.json .eslintrc.js .prettierrc jest.config.js ./
COPY src ./src
COPY tests ./tests
COPY scripts ./scripts
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY src/migrations ./src/migrations
COPY scripts ./scripts

EXPOSE 4000
CMD ["sh", "-c", "npm run migrate:node && npm start"]