FROM node:16.16.0-alpine
WORKDIR /app
COPY package.json .

ARG NODE_ENV
RUN if [ "$NODE_ENV" = "dev" ]; \
    then npm install; \
    else npm install --only=production; \
    fi

COPY . ./
EXPOSE 3000
CMD ["npm", "run", "start-prod"]