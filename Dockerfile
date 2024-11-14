FROM node:slim

# Create a directory inside the container for the app
WORKDIR /app

# Copy the package.json and package-lock.json files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the .env file
COPY .env .env

# Copy the rest of the application files
COPY . .

# Expose the app on port 4000
EXPOSE 4000

# Run the application
CMD ["node", "index.js"]
