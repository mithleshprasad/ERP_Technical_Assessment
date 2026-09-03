FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 4000

CMD ["sh", "-c", "npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all && node src/server.js"]
