FROM node:16 AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM nginx as production
#COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY certs /etc/certs
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
EXPOSE 443
