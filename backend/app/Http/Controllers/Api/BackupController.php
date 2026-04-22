<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class BackupController extends Controller
{
    public function index()
    {
        $backups = collect(Storage::disk('local')->files('backups'))
            ->map(fn($file) => [
                'id' => basename($file),
                'filename' => basename($file),
                'size' => Storage::disk('local')->size($file),
                'createdAt' => date('c', Storage::disk('local')->lastModified($file)),
            ])
            ->sortByDesc('createdAt')
            ->values();

        return response()->json(['data' => $backups]);
    }

    public function store(Request $request)
    {
        $tables = ['users', 'courses', 'enrollments', 'class_sessions', 'announcements', 'assignments', 'submissions', 'settings'];
        $data = [];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                $data[$table] = DB::table($table)->get();
            }
        }

        $filename = 'backup_' . date('Y-m-d_His') . '.json';
        Storage::disk('local')->put('backups/' . $filename, json_encode($data, JSON_PRETTY_PRINT));

        return response()->json([
            'message' => 'Backup created successfully',
            'data' => [
                'id' => $filename,
                'filename' => $filename,
                'size' => Storage::disk('local')->size('backups/' . $filename),
                'createdAt' => date('c'),
            ]
        ]);
    }

    public function download(string $filename)
    {
        if (!Storage::disk('local')->exists('backups/' . $filename)) {
            return response()->json(['message' => 'Backup not found'], 404);
        }

        return Storage::disk('local')->download('backups/' . $filename);
    }

    public function destroy(string $filename)
    {
        if (Storage::disk('local')->exists('backups/' . $filename)) {
            Storage::disk('local')->delete('backups/' . $filename);
        }

        return response()->json(['message' => 'Backup deleted successfully']);
    }
}
