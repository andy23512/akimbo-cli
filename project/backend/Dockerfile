FROM python:3.7

COPY . /backend

WORKDIR /backend

ENV PYTHONUNBUFFERED 1

RUN echo deb http://tw.archive.ubuntu.com/ubuntu/ xenial main restricted >> /etc/apt/sources.list \
  && apt-key adv --no-tty --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3B4FE6ACC0B21F32 \
  && apt-get update -qqy \
  && apt-get remove -y libjpeg62-turbo-dev \
  && apt-get install -qqy --no-install-recommends \
    git \
    ca-certificates \
    build-essential \
    cmake \
#   libjpeg8 \
    libjpeg8-dev \
    postgresql-client \
    libtool \
    pkg-config \
    zlib1g-dev \
    libpng-dev \
    libtiff-dev \
    libz-dev \
    libperl-dev \
    libgtk2.0-dev \
    libxml2-dev \
    sqlite3 libsqlite3-dev \
    libcairo2-dev \
    autoconf \
    automake \
    ffmpeg \
    vim-tiny \
  && apt-get autoclean \
  && python3 -m pip install pip

COPY . /backend

RUN \
  pip install --no-cache-dir \
  -r /backend/requirements.txt \
  && rm -rf /var/lib/apt/lists/* \

EXPOSE 8000

WORKDIR /backend
