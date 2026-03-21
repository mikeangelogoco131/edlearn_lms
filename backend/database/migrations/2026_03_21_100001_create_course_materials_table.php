<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('title');
            $table->text('description')->nullable();

            $table->string('original_name');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->string('file_path');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_materials');
    }
};
