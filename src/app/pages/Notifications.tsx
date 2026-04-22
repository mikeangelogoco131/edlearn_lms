import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DashboardLayout } from '../components/DashboardLayout';
import { api, ApiNotification } from '../lib/api';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.notifications();
      setNotifications(res.data);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
      );
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, readAt: new Date().toISOString() }))
      );
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (n: ApiNotification) => {
    if (!n.readAt) {
      handleMarkAsRead(n.id);
    }
    if (n.data?.url) {
      navigate(n.data.url);
    }
  };

  return (
    <DashboardLayout title="Notifications">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              disabled={loading || notifications.every(n => !!n.readAt)}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>All Notifications</CardTitle>
                <CardDescription>
                  {notifications.filter(n => !n.readAt).length} unread notifications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground italic">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Bell className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground">No notifications yet.</p>
              </div>
            ) : (
              <div className="divide-y border-t">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted/30 cursor-pointer ${!n.readAt ? 'bg-blue-50/30' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="mt-1">
                      {!n.readAt ? (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      ) : (
                        <div className="w-2 h-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-medium text-sm ${!n.readAt ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(n.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(n.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
