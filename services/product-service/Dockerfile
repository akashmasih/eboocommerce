FROM node:20-alpine
WORKDIR /app
COPY services/product-service/package.json services/product-service/package-lock.json* ./
RUN npm install --production=false
COPY shared ./shared
COPY services/product-service/ ./
RUN npx prisma generate
RUN npm run build
EXPOSE 4002
CMD ["npm", "start"]
