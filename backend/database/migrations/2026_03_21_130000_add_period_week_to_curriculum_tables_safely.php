<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // These checks make the migration safe to run even if some columns were added earlier.

        if (Schema::hasTable('lessons')) {
            Schema::table('lessons', function (Blueprint $table) {
                if (! Schema::hasColumn('lessons', 'period')) {
                    $table->string('period')->default('prelim')->index()->after('content');
                }
                if (! Schema::hasColumn('lessons', 'week_in_period')) {
                    $table->unsignedTinyInteger('week_in_period')->default(1)->index()->after('period');
                }
            });
        }

        if (Schema::hasTable('assignments')) {
            Schema::table('assignments', function (Blueprint $table) {
                if (! Schema::hasColumn('assignments', 'period')) {
                    $table->string('period')->default('prelim')->index()->after('description');
                }
                if (! Schema::hasColumn('assignments', 'week_in_period')) {
                    $table->unsignedTinyInteger('week_in_period')->default(1)->index()->after('period');
                }
            });
        }

        if (Schema::hasTable('course_materials')) {
            Schema::table('course_materials', function (Blueprint $table) {
                if (! Schema::hasColumn('course_materials', 'period')) {
                    $table->string('period')->default('prelim')->index()->after('description');
                }
                if (! Schema::hasColumn('course_materials', 'week_in_period')) {
                    $table->unsignedTinyInteger('week_in_period')->default(1)->index()->after('period');
                }
            });
        }
    }

    public function down(): void
    {
        // Keep down() conservative to avoid data loss in environments where
        // these columns may already be relied upon.
    }
};
