#For the development
# FROM node:24-alpine3.21
# WORKDIR /app
# COPY package*.json .
# RUN npm install
# RUN npm install -g concurrently
# COPY . .
# EXPOSE 3000
# EXPOSE 8288
# CMD ["npm", "run","dev"]

#for the production
# --- Stage 1: Build Stage ---
# This stage installs all dependencies, including devDependencies, to build the app if needed.
FROM node:24-alpine3.21 AS builder
WORKDIR /app
COPY package*.json .
RUN npm install

# Copy the rest of your application code
COPY . .


# --- Stage 2: Production Stage ---
# This stage creates the final, lean image for production.
FROM node:24-alpine3.21
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/package*.json .

# Install ONLY production dependencies. This makes the image smaller and more secure.
RUN npm install --omit=dev

# Copy the application code from the builder stage
COPY --from=builder /app .

# Expose the port your application runs on
EXPOSE 3000

# The command to run your application in production
CMD ["npm", "start"]
