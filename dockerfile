FROM node:17

RUN mkdir -p /usr/src/semaphore
WORKDIR /usr/src/semaphore

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 80

CMD ["node", "app.js", "-v"]