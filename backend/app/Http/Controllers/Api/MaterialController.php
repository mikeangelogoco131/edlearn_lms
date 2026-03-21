<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseMaterial;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MaterialController extends Controller
{
    public function index(Request $request, Course $course)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! $this->canViewCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $materials = CourseMaterial::query()
            ->where('course_id', $course->id)
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $materials->map(fn (CourseMaterial $m) => $this->materialToArray($m))->values(),
        ]);
    }

    public function store(Request $request, Course $course)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'period' => ['nullable', 'string', 'max:50'],
            'week_in_period' => ['nullable', 'integer', 'min:1', 'max:4'],
            'file' => ['required', 'file', 'max:25600'],
        ]);

        $file = $request->file('file');
        if (! $file) {
            return response()->json(['message' => 'File is required'], 422);
        }

        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getClientMimeType();
        $size = (int) $file->getSize();

        $path = $file->store("course_materials/{$course->id}");

        $material = CourseMaterial::query()->create([
            'course_id' => $course->id,
            'uploaded_by' => $user->id,
            'title' => ($validated['title'] ?? null) ?: $originalName,
            'description' => $validated['description'] ?? null,
            'period' => $validated['period'] ?? 'prelim',
            'week_in_period' => (int) ($validated['week_in_period'] ?? 1),
            'file_path' => $path,
            'original_name' => $originalName,
            'mime_type' => $mimeType,
            'size_bytes' => $size,
        ]);

        return response()->json(['data' => $this->materialToArray($material)], 201);
    }

    public function download(Request $request, CourseMaterial $material)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $course = Course::query()->findOrFail($material->course_id);
        if (! $this->canViewCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (! Storage::exists($material->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::download($material->file_path, $material->original_name);
    }

    public function destroy(Request $request, Course $course, CourseMaterial $material)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ((int) $material->course_id !== (int) $course->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! $this->canManageCourse($user, $course)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (Storage::exists($material->file_path)) {
            Storage::delete($material->file_path);
        }

        $material->delete();

        return response()->json(['message' => 'Deleted']);
    }

    private function canViewCourse(User $user, Course $course): bool
    {
        if ($user->role === User::ROLE_ADMIN) {
            return true;
        }

        if ($user->role === User::ROLE_TEACHER) {
            return (int) $course->teacher_id === (int) $user->id;
        }

        return Enrollment::query()
            ->where('course_id', $course->id)
            ->where('student_id', $user->id)
            ->where('status', 'enrolled')
            ->exists();
    }

    private function canManageCourse(User $user, Course $course): bool
    {
        if ($user->role === User::ROLE_ADMIN) {
            return true;
        }

        return $user->role === User::ROLE_TEACHER
            && (int) $course->teacher_id === (int) $user->id;
    }

    private function materialToArray(CourseMaterial $material): array
    {
        return [
            'id' => (string) $material->id,
            'courseId' => (string) $material->course_id,
            'title' => $material->title,
            'description' => $material->description ?? '',
            'period' => $material->period ?? 'prelim',
            'weekInPeriod' => (int) ($material->week_in_period ?? 1),
            'originalName' => $material->original_name,
            'mimeType' => $material->mime_type,
            'sizeBytes' => (int) $material->size_bytes,
            'downloadPath' => "/api/materials/{$material->id}/download",
            'createdAt' => optional($material->created_at)->toIso8601String(),
        ];
    }
}
