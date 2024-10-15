FROM node:16 AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM nginx as production
COPY --from=build /app/dist /usr/share/nginx/html
