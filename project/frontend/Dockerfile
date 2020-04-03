FROM node:10.17

COPY . /frontend

WORKDIR /frontend/

EXPOSE 4200

RUN npm i yarn \
    && rm package-lock.json \
    && yarn
