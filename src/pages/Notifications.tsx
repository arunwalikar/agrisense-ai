import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, AlertTriangle, Droplets, Bug, CloudRain, Check, Loader2, Trash2 } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "weather":
      return <CloudRain className="h-5 w-5 text-blue-500" />;
    case "irrigation":
      return <Droplets className="h-5 w-5 text-cyan-500" />;
    case "pest":
      return <Bug className="h-5 w-5 text-red-500" />;
    case "alert":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    default:
      return <Bell className="h-5 w-5 text-primary" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "weather":
      return "bg-blue-500/10 border-blue-500/20";
    case "irrigation":
      return "bg-cyan-500/10 border-cyan-500/20";
    case "pest":
      return "bg-red-500/10 border-red-500/20";
    case "alert":
      return "bg-yellow-500/10 border-yellow-500/20";
    default:
      return "bg-primary/10 border-primary/20";
  }
};

// Sample notifications for demo
const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Heavy Rain Alert",
    message: "Heavy rainfall expected in your area tomorrow. Consider postponing fertilizer application.",
    type: "weather",
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Irrigation Reminder",
    message: "Your wheat field may need irrigation. Soil moisture levels are low.",
    type: "irrigation",
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    title: "Pest Alert",
    message: "Aphid infestation reported in nearby farms. Monitor your crops closely.",
    type: "pest",
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "4",
    title: "Market Update",
    message: "Wheat prices have increased by 5% in Delhi APMC today.",
    type: "info",
    is_read: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

const Notifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use sample notifications for demo
    setTimeout(() => {
      setNotifications(SAMPLE_NOTIFICATIONS);
      setLoading(false);
    }, 500);
  }, [user]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    toast({ title: "Marked as read" });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast({ title: "All notifications marked as read" });
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast({ title: "Notification deleted" });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" /> Mark All Read
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-soft bg-blue-500/10">
          <CardContent className="pt-4 flex items-center gap-3">
            <CloudRain className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Weather Alerts</p>
              <p className="text-xl font-bold">1</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft bg-cyan-500/10">
          <CardContent className="pt-4 flex items-center gap-3">
            <Droplets className="h-8 w-8 text-cyan-500" />
            <div>
              <p className="text-sm text-muted-foreground">Irrigation</p>
              <p className="text-xl font-bold">1</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft bg-red-500/10">
          <CardContent className="pt-4 flex items-center gap-3">
            <Bug className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Pest Alerts</p>
              <p className="text-xl font-bold">1</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft bg-primary/10">
          <CardContent className="pt-4 flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{notifications.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`shadow-soft transition-all ${
              notification.is_read ? "opacity-60" : ""
            } ${getNotificationColor(notification.type)}`}
          >
            <CardContent className="flex items-start gap-4 py-4">
              <div className="mt-1">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {notification.title}
                      {!notification.is_read && (
                        <Badge className="bg-primary text-primary-foreground text-[10px]">New</Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 w-8"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {notifications.length === 0 && (
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No notifications</h3>
              <p className="text-muted-foreground text-center">
                You're all caught up! Check back later for updates.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Notifications;
