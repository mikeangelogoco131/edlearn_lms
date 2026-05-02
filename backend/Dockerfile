FROM php:8.2-apache

# Install dependencies
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
    && docker-php-ext-install pdo pdo_mysql gd \
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

# Enable Apache mod_rewrite for Laravel
RUN a2enmod rewrite

# Set DocumentRoot to public
RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /app/public|' /etc/apache2/sites-available/000-default.conf
RUN sed -i '/<Directory \/var\/www\/html>/,/<\/Directory>/c\<Directory /app/public>\n    Options Indexes FollowSymLinks\n    AllowOverride All\n    Require all granted\n<\/Directory>' /etc/apache2/sites-available/000-default.conf

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
