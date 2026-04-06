FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Generate Prisma client for Linux inside the image
COPY prisma ./prisma
RUN npx prisma generate

FROM base AS dev
EXPOSE 3000
# Clear .next cache (may contain Windows paths) then start dev server
CMD ["sh", "-c", "rm -rf .next && npm run dev"]
