FROM node:20-alpine
COPY shared ./shared
WORKDIR /app
COPY services/review-service/package.json services/review-service/package-lock.json* ./
RUN npm install --production=false
COPY services/review-service/ ./
RUN npx prisma generate
RUN npm run build
EXPOSE 4011
CMD ["npm", "start"]
