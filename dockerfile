FROM node:14 AS ui-build

WORKDIR /usr/src/app

COPY reactive-music-client/ ./reactive-music-client/

RUN cd reactive-music-client && yarn install && yarn run build



FROM node:14 AS server-build

WORKDIR /root/

COPY --from=ui-build /usr/src/app/reactive-music-client/dist ./dist

COPY server/**  ./

RUN yarn install
RUN yarn build
RUN ls

EXPOSE 8080

CMD ["node", "dist/main.js"]