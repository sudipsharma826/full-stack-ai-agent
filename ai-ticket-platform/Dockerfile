# For the development
# FROM node:20.19-alpine
# WORKDIR /app
# COPY package*.json .
# RUN npm install
# COPY . .
# EXPOSE 5173
# CMD ["npm", "run","dev"]

#For the production
# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: Production Stage ---
FROM nginx:1.27-alpine

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove the default Nginx configuration file
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]