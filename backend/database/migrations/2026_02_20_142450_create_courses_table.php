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
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('code');
            $table->string('title');
            $table->text('description')->nullable();

            $table->string('section')->nullable();
            $table->string('term')->nullable();
            $table->string('schedule')->nullable();

            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();

            $table->string('status')->default('active')->index();
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();

            $table->unique(['code', 'section', 'term']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
