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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('recipient_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('subject')->nullable();
            $table->text('body');

            $table->string('status')->default('sent')->index(); // draft|sent
            $table->timestamp('sent_at')->nullable()->index();
            $table->timestamp('read_at')->nullable()->index();

            $table->timestamp('sender_deleted_at')->nullable()->index();
            $table->timestamp('recipient_deleted_at')->nullable()->index();

            $table->timestamps();

            $table->index(['recipient_id', 'status', 'sent_at']);
            $table->index(['sender_id', 'status', 'sent_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
