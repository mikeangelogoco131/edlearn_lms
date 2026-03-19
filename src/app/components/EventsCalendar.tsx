import { useEffect, useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns';
import { api, ApiEvent } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Calendar } from './ui/calendar';

function toDatetimeLocalValue(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function EventsCalendar(props: { canManage: boolean }) {
  const { canManage } = props;

  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [endsAt, setEndsAt] = useState('');
  const [saving, setSaving] = useState(false);

  const monthRange = useMemo(() => {
    const start = format(startOfMonth(month), 'yyyy-MM-dd');
    const end = format(endOfMonth(month), 'yyyy-MM-dd');
    return { start, end };
  }, [month]);

  const eventsForSelectedDate = useMemo(() => {
    return events
      .filter((e) => {
        try {
          return isSameDay(parseISO(e.startsAt), selectedDate);
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [events, selectedDate]);

  const eventDays = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      try {
        set.add(format(parseISO(e.startsAt), 'yyyy-MM-dd'));
      } catch {
        // ignore malformed dates
      }
    }
    return set;
  }, [events]);

  async function loadEvents() {
    setLoading(true);
    setError('');
    try {
      const res = await api.events(monthRange);
      setEvents(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthRange.start, monthRange.end]);

  const startEndHint = useMemo(() => {
    if (!startsAt) return '';
    try {
      const start = new Date(startsAt);
      const end = endsAt ? new Date(endsAt) : null;
      const startText = format(start, 'MMM d, yyyy h:mm a');
      const endText = end ? format(end, 'MMM d, yyyy h:mm a') : '';
      return endText ? `${startText} → ${endText}` : startText;
    } catch {
      return '';
    }
  }, [startsAt, endsAt]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setStartsAt(toDatetimeLocalValue(new Date()));
    setEndsAt('');
  };

  const beginEdit = (event: ApiEvent) => {
    setEditingId(event.id);
    setTitle(event.title);
    setDescription(event.description || '');
    try {
      setStartsAt(toDatetimeLocalValue(parseISO(event.startsAt)));
      setEndsAt(event.endsAt ? toDatetimeLocalValue(parseISO(event.endsAt)) : '');
    } catch {
      // Keep whatever is already in the form
    }
  };

  const onSave = async () => {
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!startsAt) {
      setError('Start date/time is required');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.updateEvent(editingId, {
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          starts_at: startsAt,
          ends_at: endsAt ? endsAt : null,
        });
      } else {
        await api.createEvent({
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          starts_at: startsAt,
          ends_at: endsAt ? endsAt : null,
        });
      }

      resetForm();
      await loadEvents();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (event: ApiEvent) => {
    setError('');
    if (!window.confirm('Delete this event?')) return;

    setSaving(true);
    try {
      await api.deleteEvent(event.id);
      if (editingId === event.id) resetForm();
      await loadEvents();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {canManage ? (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>{editingId ? 'Edit Event' : 'Add Event'}</CardTitle>
                <CardDescription>{startEndHint || 'Create a calendar event visible to everyone'}</CardDescription>
              </div>
              {editingId ? (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Parent-Teacher Meeting"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-starts">Starts</Label>
                <Input
                  id="event-starts"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="event-description">Description (optional)</Label>
                <Textarea
                  id="event-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-ends">Ends (optional)</Label>
                <Input
                  id="event-ends"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={onSave}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Event'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>{format(month, 'MMMM yyyy')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={selectedDate}
              onSelect={(d) => {
                if (d) setSelectedDate(d);
              }}
              modifiers={{
                hasEvent: (d) => eventDays.has(format(d, 'yyyy-MM-dd')),
              }}
              modifiersClassNames={{
                hasEvent: 'ring-1 ring-primary font-semibold',
              }}
            />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>
              {format(selectedDate, 'MMM d, yyyy')}
              {loading ? ' • Loading…' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventsForSelectedDate.length === 0 ? (
                <div className="text-sm text-muted-foreground">No events for this day.</div>
              ) : (
                eventsForSelectedDate.map((e) => {
                  const start = (() => {
                    try {
                      return format(parseISO(e.startsAt), 'h:mm a');
                    } catch {
                      return e.startsAt;
                    }
                  })();
                  const end = e.endsAt
                    ? (() => {
                        try {
                          return format(parseISO(e.endsAt), 'h:mm a');
                        } catch {
                          return e.endsAt;
                        }
                      })()
                    : null;

                  return (
                    <div key={e.id} className="p-4 glass-item">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{e.title}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {end ? `${start} – ${end}` : start}
                          </div>
                          {e.description ? (
                            <div className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">{e.description}</div>
                          ) : null}
                        </div>

                        {canManage ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => beginEdit(e)}
                              disabled={saving}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(e)}
                              disabled={saving}
                            >
                              Delete
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
