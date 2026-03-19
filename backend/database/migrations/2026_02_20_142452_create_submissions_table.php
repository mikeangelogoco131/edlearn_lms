<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('assignments')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();

            $table->timestamp('submitted_at')->nullable();
            $table->text('content')->nullable();

            $table->string('status')->default('not_submitted')->index();
            $table->decimal('grade', 5, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->timestamp('graded_at')->nullable();

            $table->unique(['assignment_id', 'student_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
