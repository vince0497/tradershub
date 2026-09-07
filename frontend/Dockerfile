FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build



ENV PORT=5137

EXPOSE 5137

CMD ["npm", "start"]

#  docker run -p 5000:5137 image_name