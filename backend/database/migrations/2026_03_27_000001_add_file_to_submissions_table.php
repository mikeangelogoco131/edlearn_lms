<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            if (!Schema::hasColumn('submissions', 'file_path')) {
                $table->string('file_path')->nullable()->after('content');
            }
            if (!Schema::hasColumn('submissions', 'original_file_name')) {
                $table->string('original_file_name')->nullable()->after('file_path');
            }
            if (!Schema::hasColumn('submissions', 'file_mime_type')) {
                $table->string('file_mime_type')->nullable()->after('original_file_name');
            }
            if (!Schema::hasColumn('submissions', 'file_size_bytes')) {
                $table->unsignedBigInteger('file_size_bytes')->nullable()->after('file_mime_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            if (Schema::hasColumn('submissions', 'file_size_bytes')) {
                $table->dropColumn('file_size_bytes');
            }
            if (Schema::hasColumn('submissions', 'file_mime_type')) {
                $table->dropColumn('file_mime_type');
            }
            if (Schema::hasColumn('submissions', 'original_file_name')) {
                $table->dropColumn('original_file_name');
            }
            if (Schema::hasColumn('submissions', 'file_path')) {
                $table->dropColumn('file_path');
            }
        });
    }
};
