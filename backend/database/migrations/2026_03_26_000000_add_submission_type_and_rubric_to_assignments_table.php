<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            if (! Schema::hasColumn('assignments', 'submission_type')) {
                $table->string('submission_type')->default('online_text')->index()->after('status');
            }
            if (! Schema::hasColumn('assignments', 'rubric')) {
                $table->json('rubric')->nullable()->after('submission_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            if (Schema::hasColumn('assignments', 'rubric')) {
                $table->dropColumn('rubric');
            }
            if (Schema::hasColumn('assignments', 'submission_type')) {
                $table->dropColumn('submission_type');
            }
        });
    }
};
