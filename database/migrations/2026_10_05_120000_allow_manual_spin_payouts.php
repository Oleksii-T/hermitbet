<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wins', function (Blueprint $table): void {
            $table->unsignedInteger('multiplier')->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('wins')->whereNull('multiplier')->update(['multiplier' => 0]);

        Schema::table('wins', function (Blueprint $table): void {
            $table->unsignedInteger('multiplier')->nullable(false)->change();
        });
    }
};
