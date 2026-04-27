FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" && \
    php composer-setup.php --install-dir=/usr/local/bin --filename=composer && \
    rm composer-setup.php && \
    composer install --no-dev --optimize-autoloader --quiet

RUN mkdir -p database storage/app storage/framework/cache storage/framework/views storage/framework/sessions storage/logs && \
    chmod -R 777 database storage bootstrap/cache

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
