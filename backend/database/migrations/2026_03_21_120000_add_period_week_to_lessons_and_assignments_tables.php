<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->string('period')->default('prelim')->index()->after('content');
            $table->unsignedTinyInteger('week_in_period')->default(1)->index()->after('period');
        });

        Schema::table('assignments', function (Blueprint $table) {
            $table->string('period')->default('prelim')->index()->after('description');
            $table->unsignedTinyInteger('week_in_period')->default(1)->index()->after('period');
        });

        Schema::table('course_materials', function (Blueprint $table) {
            $table->string('period')->default('prelim')->index()->after('description');
            $table->unsignedTinyInteger('week_in_period')->default(1)->index()->after('period');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['period', 'week_in_period']);
        });

        Schema::table('assignments', function (Blueprint $table) {
            $table->dropColumn(['period', 'week_in_period']);
        });

        Schema::table('course_materials', function (Blueprint $table) {
            $table->dropColumn(['period', 'week_in_period']);
        });
    }
};
