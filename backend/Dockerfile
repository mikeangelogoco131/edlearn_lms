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

# Remove .env from repo so Railway environment variables are used instead of dev defaults.
RUN rm -f .env

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Create necessary directories
RUN mkdir -p database storage/app storage/framework/cache storage/framework/views storage/framework/sessions storage/logs && \
    chmod -R 777 database storage bootstrap/cache

# Expose port
EXPOSE 8000

# Start Laravel on Railway-assigned PORT using PHP's built-in server.
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8000} -t public"]
