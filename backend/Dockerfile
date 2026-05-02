<<<<<<< HEAD
FROM php:8.2-cli
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
    rm composer-setup.php && \
    composer install --no-dev --optimize-autoloader --quiet

# Copy project files (supports either repo-root context or backend-only context).
COPY . .

# Resolve Laravel app directory regardless of build context and install dependencies.
RUN set -eux; \
    if [ -f /app/composer.json ]; then APP_DIR=/app; \
    elif [ -f /app/backend/composer.json ]; then APP_DIR=/app/backend; \
    else echo "composer.json not found in /app or /app/backend"; ls -la /app; exit 1; fi; \
    ln -sfn "$APP_DIR" /app/laravel; \
    rm -f /app/laravel/.env; \
    cd /app/laravel; \
    composer install --no-dev --optimize-autoloader; \
    mkdir -p database storage/app storage/framework/cache storage/framework/views storage/framework/sessions storage/logs; \
    chmod -R 777 database storage bootstrap/cache
    postgresql-client \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
# Start Laravel on Railway-assigned PORT using PHP's built-in server.
CMD ["sh", "-c", "cd /app/laravel && php -S 0.0.0.0:${PORT:-8000} -t public"]

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

# Install Nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Copy Nginx config
COPY backend/nginx.conf /etc/nginx/sites-available/default

# Expose port
EXPOSE 8000

# Start PHP-FPM and Nginx
CMD ["sh", "-c", "php-fpm & nginx -g 'daemon off;'"]
>>>>>>> c34fa1c (Add Railway + Vercel deployment configuration)
