import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { api, ApiAnnouncement, ApiCourse } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export function CourseAnnouncements(props: {
  courses: ApiCourse[];
  canPost: boolean;
}) {
  const { courses, canPost } = props;

  const [courseId, setCourseId] = useState<string>('');
  const [announcements, setAnnouncements] = useState<ApiAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!courseId && courses.length) {
      const firstCourse = courses[0];
      if (firstCourse) setCourseId(firstCourse.id);
    }
  }, [courseId, courses]);

  const selectedCourse = useMemo(() => {
    if (courseId === '__global__') return null;
    return courses.find((c) => c.id === courseId) ?? null;
  }, [courses, courseId]);

  async function loadAnnouncements(activeCourseId: string) {
    setLoading(true);
    setError('');
    try {
      let res;
      if (activeCourseId === '__global__') {
        res = await api.globalAnnouncements();
      } else {
        res = await api.courseAnnouncements(activeCourseId);
      }
      setAnnouncements(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!courseId) return;
    loadAnnouncements(courseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const onPost = async () => {
    setError('');

    if (!courseId) {
      setError('Please select a course');
      return;
    }

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!body.trim()) {
      setError('Announcement text is required');
      return;
    }

    setSaving(true);
    try {
      if (courseId === '__global__') {
        await api.createGlobalAnnouncement({ title: title.trim(), body: body.trim() });
      } else {
        await api.createCourseAnnouncement(courseId, { title: title.trim(), body: body.trim() });
      }

      setTitle('');
      setBody('');
      await loadAnnouncements(courseId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post announcement');
    } finally {
      setSaving(false);
    }
  };

  if (!courses.length) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
          <CardDescription>No courses available.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
          <CardDescription>
            {selectedCourse ? `Course: ${selectedCourse.code} • ${selectedCourse.title}` : 'Select a course'}
            {loading ? ' • Loading…' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <Label>Course</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="__global__" value="__global__">
                  Announcement for all
                </SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} • {c.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canPost ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="announce-title">Title</Label>
                <Input
                  id="announce-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Exam schedule update"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="announce-body">Announcement</Label>
                <Textarea
                  id="announce-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write the announcement here…"
                />
              </div>

              <div className="flex items-end">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={onPost}
                  disabled={saving}
                >
                  {saving ? 'Posting…' : 'Post Announcement'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              You can view announcements here.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-6 text-sm text-muted-foreground">No announcements yet.</CardContent>
          </Card>
        ) : (
          announcements.map((a) => {
            const publishedText = a.publishedAt
              ? (() => {
                  try {
                    return format(parseISO(a.publishedAt), 'MMM d, yyyy h:mm a');
                  } catch {
                    return a.publishedAt;
                  }
                })()
              : '—';

            return (
              <Card key={a.id} className="glass-card">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <CardTitle className="text-lg truncate">{a.title}</CardTitle>
                        {a.isPinned ? <Badge variant="secondary">Pinned</Badge> : null}
                      </div>
                      <CardDescription>
                        {a.author?.name ? `By ${a.author.name}` : '—'} • {publishedText}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm text-foreground">
                    {a.body}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
