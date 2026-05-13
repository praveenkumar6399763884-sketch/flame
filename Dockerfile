FROM ubuntu:22.04
RUN apt update && apt install -y nodejs npm
WORKDIR /app
COPY package.json server.js ./
COPY raj /app/raj
RUN npm install
RUN chmod +x /app/raj
EXPOSE 8080
CMD ["node", "server.js"]
