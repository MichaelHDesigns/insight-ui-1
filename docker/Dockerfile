FROM node:8-alpine

RUN apk add --update --no-cache git \
                                libzmq \
                                zeromq-dev \
                                python \
                                make \
                                g++

WORKDIR /insight

# Copy umbrucore-node
RUN git clone --branch master --single-branch --depth 1 https://github.com/umbru/umbrucore-node.git .

# Copy config file
COPY umbrucore-node.json .

# Install NPM modules
RUN npm ci

ARG VERSION
ARG MAJOR_VERSION

# Install Insight modules
RUN bin/umbrucore-node install insight-api@${MAJOR_VERSION}
RUN bin/umbrucore-node install insight-ui@${VERSION}

FROM node:8-alpine

LABEL maintainer="Umbru Developers <dev@dash.org>"
LABEL description="Dockerised Insight-Umbru"

WORKDIR /insight

# Copy project files
COPY --from=0 /insight/ .

EXPOSE 3001

CMD ["bin/umbrucore-node", "start"]
