import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, QrCode } from "lucide-react";
import { toast } from "sonner";

interface Connection {
  id: string;
  name: string;
  phone_number: string | null;
  status: string;
  qr_code: string | null;
  webhook_url: string | null;
  n8n_webhook_url: string | null;
  last_connected_at: string | null;
}

const Connections = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newConnection, setNewConnection] = useState({
    name: "",
    webhook_url: "",
    n8n_webhook_url: ""
  });

  useEffect(() => {
    checkAuth();
    fetchConnections();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error: any) {
      toast.error("فشل تحميل الاتصالات");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnection = async () => {
    if (!newConnection.name.trim()) {
      toast.error("يرجى إدخال اسم الاتصال");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase.from("whatsapp_connections").insert({
        user_id: user.id,
        name: newConnection.name,
        webhook_url: newConnection.webhook_url || null,
        n8n_webhook_url: newConnection.n8n_webhook_url || null,
        status: "disconnected"
      });

      if (error) throw error;

      toast.success("تم إنشاء الاتصال بنجاح");
      setDialogOpen(false);
      setNewConnection({ name: "", webhook_url: "", n8n_webhook_url: "" });
      fetchConnections();
    } catch (error: any) {
      toast.error(error.message || "فشل إنشاء الاتصال");
    }
  };

  const handleDeleteConnection = async (id: string) => {
    try {
      const { error } = await supabase
        .from("whatsapp_connections")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("تم حذف الاتصال");
      fetchConnections();
    } catch (error: any) {
      toast.error("فشل حذف الاتصال");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      connected: "default",
      connecting: "secondary",
      disconnected: "outline",
      error: "destructive"
    };
    
    const labels: Record<string, string> = {
      connected: "متصل",
      connecting: "جاري الاتصال",
      disconnected: "غير متصل",
      error: "خطأ"
    };

    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">اتصالات واتساب</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                اتصال جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة اتصال واتساب جديد</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل الاتصال الجديد
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الاتصال *</Label>
                  <Input
                    id="name"
                    placeholder="مثال: حساب العمل"
                    value={newConnection.name}
                    onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook">Webhook URL (اختياري)</Label>
                  <Input
                    id="webhook"
                    placeholder="https://example.com/webhook"
                    value={newConnection.webhook_url}
                    onChange={(e) => setNewConnection({ ...newConnection, webhook_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="n8n">n8n Webhook URL (اختياري)</Label>
                  <Input
                    id="n8n"
                    placeholder="https://n8n.example.com/webhook"
                    value={newConnection.n8n_webhook_url}
                    onChange={(e) => setNewConnection({ ...newConnection, n8n_webhook_url: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateConnection} className="w-full">
                  إنشاء الاتصال
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-8">
        {connections.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle>لا توجد اتصالات بعد</CardTitle>
              <CardDescription>
                أنشئ اتصال واتساب جديد للبدء
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {connections.map((connection) => (
              <Card key={connection.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{connection.name}</CardTitle>
                      <CardDescription>
                        {connection.phone_number || "لم يتم الربط بعد"}
                      </CardDescription>
                    </div>
                    {getStatusBadge(connection.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {connection.webhook_url && (
                      <p className="truncate">Webhook: {connection.webhook_url}</p>
                    )}
                    {connection.n8n_webhook_url && (
                      <p className="truncate">n8n: {connection.n8n_webhook_url}</p>
                    )}
                    {connection.last_connected_at && (
                      <p>آخر اتصال: {new Date(connection.last_connected_at).toLocaleDateString('ar')}</p>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <QrCode className="ml-2 h-4 w-4" />
                      مسح QR
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteConnection(connection.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Connections;