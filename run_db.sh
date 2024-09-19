docker rm -f iot_db
docker run -it -d \
    -p 5433:5432 \
    --restart always \
    --name iot_db \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_DB=iot_test_db \
    -e POSTGRES_PASSWORD=password \
    -v $PWD/db/data:/var/lib/postgresql/data \
    postgres:16.4