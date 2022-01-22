FROM node:14-alpine AS ui-build

WORKDIR /usr/src/app

COPY reactive-music-client/ ./reactive-music-client/

RUN cd reactive-music-client && yarn install && yarn run build



FROM node:14-alpine AS server-build

WORKDIR /root/

COPY --from=ui-build /usr/src/app/reactive-music-client/dist ./dist

COPY server/package.json  ./
COPY server/yarn.lock ./

RUN yarn install
COPY server/tsconfig.json ./
COPY server/src/** ./src/

RUN yarn build
COPY server/src/music/** dist/music/

EXPOSE 8080

CMD ["node", "dist/main.js"]