FROM php:8.2-cli

# Install dependencies and PHP extensions required by Laravel + MySQL.
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    sqlite3 \
    default-mysql-client \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo_mysql gd \
    && php -m | grep -i pdo_mysql \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" && \
    php composer-setup.php --install-dir=/usr/local/bin --filename=composer && \
    rm composer-setup.php

WORKDIR /app

# Copy project files
COPY backend/ .

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Create necessary directories
RUN mkdir -p database storage/app storage/framework/cache storage/framework/views storage/framework/sessions storage/logs && \
    chmod -R 777 database storage bootstrap/cache

# Expose port
EXPOSE 8000

# Start Laravel on Railway-assigned PORT.
CMD ["sh", "-c", "php artisan config:clear && php artisan route:clear && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
