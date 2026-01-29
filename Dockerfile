# Build context: repo root (docker build -f monolith/Dockerfile .)
FROM node:20-alpine
WORKDIR /app
COPY shared ./shared
COPY monolith ./monolith
WORKDIR /app/monolith
RUN npm install --production=false
RUN npx prisma generate
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/index.js"]
