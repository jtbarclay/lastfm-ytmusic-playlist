FROM node:15.7-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install 

ADD . /usr/src/app
RUN npm npm run build

CMD [ "npm", "playlist" ]