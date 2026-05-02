<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            if (! Schema::hasColumn('lessons', 'period')) {
                $table->string('period')->default('prelim')->index()->after('content');
            }

            if (! Schema::hasColumn('lessons', 'week_in_period')) {
                $table->unsignedTinyInteger('week_in_period')->default(1)->index()->after('period');
            }
        });

        Schema::table('assignments', function (Blueprint $table) {
            if (! Schema::hasColumn('assignments', 'period')) {
                $table->string('period')->default('prelim')->index()->after('description');
            }

            if (! Schema::hasColumn('assignments', 'week_in_period')) {
                $table->unsignedTinyInteger('week_in_period')->default(1)->index()->after('period');
            }
        });

        Schema::table('course_materials', function (Blueprint $table) {
            if (! Schema::hasColumn('course_materials', 'period')) {
                $table->string('period')->default('prelim')->index()->after('description');
            }

            if (! Schema::hasColumn('course_materials', 'week_in_period')) {
                $table->unsignedTinyInteger('week_in_period')->default(1)->index()->after('period');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            if (Schema::hasColumn('lessons', 'week_in_period')) {
                $table->dropColumn('week_in_period');
            }

            if (Schema::hasColumn('lessons', 'period')) {
                $table->dropColumn('period');
            }
        });

        Schema::table('assignments', function (Blueprint $table) {
            if (Schema::hasColumn('assignments', 'week_in_period')) {
                $table->dropColumn('week_in_period');
            }

            if (Schema::hasColumn('assignments', 'period')) {
                $table->dropColumn('period');
            }
        });

        Schema::table('course_materials', function (Blueprint $table) {
            if (Schema::hasColumn('course_materials', 'week_in_period')) {
                $table->dropColumn('week_in_period');
            }

            if (Schema::hasColumn('course_materials', 'period')) {
                $table->dropColumn('period');
            }
        });
    }
};
