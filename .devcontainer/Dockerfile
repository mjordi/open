FROM mcr.microsoft.com/devcontainers/javascript-node:18

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    python3-pip \
    python3-dev \
    python3-venv \
    build-essential \
    curl \
    git \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Create and activate Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python packages in virtual environment with specific versions
RUN pip3 install --no-cache-dir --no-deps \
    hexbytes==0.3.0 \
    eth-hash==0.5.1 \
    slither-analyzer==0.9.3 \
    mythril==0.23.21

# Install Solidity compiler
RUN curl -L https://github.com/ethereum/solidity/releases/download/v0.8.20/solc-static-linux -o /usr/local/bin/solc \
    && chmod +x /usr/local/bin/solc

# Install Foundry
RUN curl -L https://foundry.paradigm.xyz | bash -s -- -f \
    && /root/.foundry/bin/foundryup

# Set up environment variables
ENV PATH="/root/.foundry/bin:${PATH}"

# Install global npm packages
RUN npm install -g \
    @nomicfoundation/hardhat-toolbox \
    hardhat \
    prettier \
    eslint \
    solhint

# Create a non-root user
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Set up the user
RUN if [ "$USER_GID" != "1000" ] || [ "$USER_UID" != "1000" ]; then \
    groupmod --gid $USER_GID $USERNAME \
    && usermod --uid $USER_UID --gid $USER_GID $USERNAME \
    && chown -R $USER_UID:$USER_GID /home/$USERNAME; \
    fi

# Switch to non-root user
USER $USERNAME

# Set up working directory
WORKDIR /workspace 