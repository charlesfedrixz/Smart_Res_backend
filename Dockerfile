FROM node:slim

# Create a directory inside the container for the app
WORKDIR /app

# Copy package.json and package-lock.json first (for caching dependencies)
COPY package*.json ./

# Install dependencies
RUN npm install

#copy env file
COPY .env /app/.env

# Copy the rest of the application files
COPY . .

# Expose the app on port 4000
EXPOSE 4000

# Run the application
CMD ["node", "index.js"]
