#!/bin/bash

# Set variables
PROJECT_NAME="satellite-iot"
NETWORK_NAME="${PROJECT_NAME}-network"
VOLUME_NAME="${PROJECT_NAME}-pgdata"
CONTAINER_NAME="${PROJECT_NAME}-db"
DB_NAME="${PROJECT_NAME}-db"
DB_USER="postgres"
DB_PASSWORD="password"
DB_PORT="5432" # Default port, can be changed

# Function: Check if the previous command was successful
check_success() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

# Function: Prompt user for port number
prompt_for_port() {
    read -p "Enter the port number for PostgreSQL (default is 5432): " user_port
    if [[ -n "$user_port" ]]; then
        if [[ "$user_port" =~ ^[0-9]+$ ]] && [ "$user_port" -ge 1024 ] && [ "$user_port" -le 65535 ]; then
            DB_PORT=$user_port
        else
            echo "Invalid port number. Using default port 5432."
        fi
    fi
    echo "Using port: $DB_PORT"
}

# Function: Check if container exists
container_exists() {
    docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"
}

# Function: Check if network exists
network_exists() {
    docker network ls --format '{{.Name}}' | grep -q "^${NETWORK_NAME}$"
}

# Function: Check if volume exists
volume_exists() {
    docker volume ls --format '{{.Name}}' | grep -q "^${VOLUME_NAME}$"
}

# Function: Stop and remove existing container
remove_container() {
    echo "Stopping and removing existing container..."
    docker stop $CONTAINER_NAME >/dev/null 2>&1
    docker rm $CONTAINER_NAME >/dev/null 2>&1
}

# Function: Create or ensure network exists
create_network() {
    if network_exists; then
        echo "Network $NETWORK_NAME already exists."
    else
        echo "Creating Docker network: $NETWORK_NAME"
        docker network create $NETWORK_NAME
        check_success "Failed to create network"
    fi
}

# Function: Create or ensure volume exists
create_volume() {
    if volume_exists; then
        echo "Volume $VOLUME_NAME already exists."
    else
        echo "Creating Docker volume: $VOLUME_NAME"
        docker volume create $VOLUME_NAME
        check_success "Failed to create volume"
    fi
}

# Function: Start PostgreSQL container
start_container() {
    echo "Starting PostgreSQL container"
    docker run --name $CONTAINER_NAME \
        -e POSTGRES_DB=$DB_NAME \
        -e POSTGRES_USER=$DB_USER \
        -e POSTGRES_PASSWORD=$DB_PASSWORD \
        -p $DB_PORT:5432 \
        -v $VOLUME_NAME:/var/lib/postgresql/data \
        --network $NETWORK_NAME \
        -d postgres:16
    check_success "Failed to start PostgreSQL container"
}

# Main execution
echo "LarryX PostgreSQL Setup"
echo "----------------------"

if container_exists; then
    read -p "Container $CONTAINER_NAME already exists. Do you want to restart it? (y/n): " restart
    if [[ $restart =~ ^[Yy]$ ]]; then
        remove_container
        prompt_for_port
        create_network
        create_volume
        start_container
    else
        echo "Exiting without changes."
        exit 0
    fi
else
    prompt_for_port
    create_network
    create_volume
    start_container
fi

echo "Setup complete!"
echo "Database container name: $CONTAINER_NAME"
echo "Database name: $DB_NAME"
echo "Username: $DB_USER"
echo "Password: $DB_PASSWORD"
echo "Port: $DB_PORT"
echo "Network: $NETWORK_NAME"
echo "Volume: $VOLUME_NAME"
