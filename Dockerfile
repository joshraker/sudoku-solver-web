FROM node:14-alpine

WORKDIR /app

ADD package.json package-lock.json ./
RUN npm install

ADD . ./
RUN npm run build && npm prune --production

EXPOSE 5000

ENTRYPOINT []
CMD ["npx", "serve", "-s", "build"]
