import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface Connection {
  id: string;
  name: string;
}

interface Trigger {
  id: string;
  name: string;
  trigger_type: string;
  trigger_value: string | null;
  action_type: string;
  action_data: any;
  is_active: boolean;
  connection_id: string;
}

const Triggers = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTrigger, setNewTrigger] = useState({
    name: "",
    connection_id: "",
    trigger_type: "message_received",
    trigger_value: "",
    action_type: "n8n_webhook",
    action_data: ""
  });

  useEffect(() => {
    checkAuth();
    fetchConnections();
    fetchTriggers();
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
        .select("id, name");

      if (error) throw error;
      setConnections(data || []);
    } catch (error: any) {
      toast.error("فشل تحميل الاتصالات");
    }
  };

  const fetchTriggers = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_triggers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTriggers(data || []);
    } catch (error: any) {
      toast.error("فشل تحميل المحفزات");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrigger = async () => {
    if (!newTrigger.name.trim() || !newTrigger.connection_id) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      let actionData = {};
      if (newTrigger.action_data.trim()) {
        try {
          actionData = JSON.parse(newTrigger.action_data);
        } catch {
          actionData = { data: newTrigger.action_data };
        }
      }

      const { error } = await supabase.from("whatsapp_triggers").insert({
        name: newTrigger.name,
        connection_id: newTrigger.connection_id,
        trigger_type: newTrigger.trigger_type,
        trigger_value: newTrigger.trigger_value || null,
        action_type: newTrigger.action_type,
        action_data: actionData,
        is_active: true
      });

      if (error) throw error;

      toast.success("تم إنشاء المحفز بنجاح");
      setDialogOpen(false);
      setNewTrigger({
        name: "",
        connection_id: "",
        trigger_type: "message_received",
        trigger_value: "",
        action_type: "n8n_webhook",
        action_data: ""
      });
      fetchTriggers();
    } catch (error: any) {
      toast.error(error.message || "فشل إنشاء المحفز");
    }
  };

  const handleToggleTrigger = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("whatsapp_triggers")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;

      toast.success(isActive ? "تم تفعيل المحفز" : "تم إيقاف المحفز");
      fetchTriggers();
    } catch (error: any) {
      toast.error("فشل تحديث المحفز");
    }
  };

  const handleDeleteTrigger = async (id: string) => {
    try {
      const { error } = await supabase
        .from("whatsapp_triggers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("تم حذف المحفز");
      fetchTriggers();
    } catch (error: any) {
      toast.error("فشل حذف المحفز");
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      message_received: "عند استقبال رسالة",
      keyword: "كلمة مفتاحية",
      specific_sender: "مرسل محدد"
    };
    return labels[type] || type;
  };

  const getActionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      n8n_webhook: "استدعاء n8n",
      auto_reply: "رد تلقائي",
      forward: "إعادة توجيه"
    };
    return labels[type] || type;
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
            <h1 className="text-2xl font-bold">المحفزات والأتمتة</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={connections.length === 0}>
                <Plus className="ml-2 h-4 w-4" />
                محفز جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء محفز جديد</DialogTitle>
                <DialogDescription>
                  قم بإعداد محفز تلقائي للرسائل
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="trigger-name">اسم المحفز *</Label>
                  <Input
                    id="trigger-name"
                    placeholder="مثال: رد تلقائي على السلام"
                    value={newTrigger.name}
                    onChange={(e) => setNewTrigger({ ...newTrigger, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="connection">الاتصال *</Label>
                  <Select
                    value={newTrigger.connection_id}
                    onValueChange={(value) => setNewTrigger({ ...newTrigger, connection_id: value })}
                  >
                    <SelectTrigger id="connection">
                      <SelectValue placeholder="اختر اتصال" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trigger-type">نوع المحفز</Label>
                  <Select
                    value={newTrigger.trigger_type}
                    onValueChange={(value) => setNewTrigger({ ...newTrigger, trigger_type: value })}
                  >
                    <SelectTrigger id="trigger-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="message_received">عند استقبال رسالة</SelectItem>
                      <SelectItem value="keyword">كلمة مفتاحية</SelectItem>
                      <SelectItem value="specific_sender">مرسل محدد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(newTrigger.trigger_type === "keyword" || newTrigger.trigger_type === "specific_sender") && (
                  <div className="space-y-2">
                    <Label htmlFor="trigger-value">
                      {newTrigger.trigger_type === "keyword" ? "الكلمة المفتاحية" : "رقم المرسل"}
                    </Label>
                    <Input
                      id="trigger-value"
                      placeholder={newTrigger.trigger_type === "keyword" ? "مثال: مرحبا" : "مثال: +966xxxxxxxxx"}
                      value={newTrigger.trigger_value}
                      onChange={(e) => setNewTrigger({ ...newTrigger, trigger_value: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="action-type">نوع الإجراء</Label>
                  <Select
                    value={newTrigger.action_type}
                    onValueChange={(value) => setNewTrigger({ ...newTrigger, action_type: value })}
                  >
                    <SelectTrigger id="action-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="n8n_webhook">استدعاء n8n</SelectItem>
                      <SelectItem value="auto_reply">رد تلقائي</SelectItem>
                      <SelectItem value="forward">إعادة توجيه</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="action-data">بيانات الإجراء (JSON أو نص)</Label>
                  <Textarea
                    id="action-data"
                    placeholder='{"webhook_url": "https://n8n.example.com/webhook"}'
                    value={newTrigger.action_data}
                    onChange={(e) => setNewTrigger({ ...newTrigger, action_data: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button onClick={handleCreateTrigger} className="w-full">
                  إنشاء المحفز
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
              <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle>لا توجد اتصالات</CardTitle>
              <CardDescription>
                يجب إنشاء اتصال واتساب أولاً قبل إضافة المحفزات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/connections")}>
                إضافة اتصال
              </Button>
            </CardContent>
          </Card>
        ) : triggers.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle>لا توجد محفزات بعد</CardTitle>
              <CardDescription>
                أنشئ محفز جديد لأتمتة رسائل واتساب
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {triggers.map((trigger) => (
              <Card key={trigger.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{trigger.name}</CardTitle>
                      <CardDescription>
                        {getTriggerTypeLabel(trigger.trigger_type)}
                        {trigger.trigger_value && ` - ${trigger.trigger_value}`}
                      </CardDescription>
                    </div>
                    <Switch
                      checked={trigger.is_active}
                      onCheckedChange={(checked) => handleToggleTrigger(trigger.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">الإجراء:</span> {getActionTypeLabel(trigger.action_type)}</p>
                    {trigger.action_data && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">البيانات:</span>{" "}
                        {typeof trigger.action_data === 'object' 
                          ? JSON.stringify(trigger.action_data) 
                          : trigger.action_data}
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTrigger(trigger.id)}
                    >
                      <Trash2 className="ml-2 h-4 w-4" />
                      حذف
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

export default Triggers;