import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

interface Connection {
  id: string;
  name: string;
  status: string;
}

const SendMessage = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({
    connection_id: "",
    to_number: "",
    message_type: "text",
    content: "",
    media_url: ""
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
        .select("id, name, status")
        .eq("status", "connected");

      if (error) throw error;
      setConnections(data || []);
    } catch (error: any) {
      toast.error("فشل تحميل الاتصالات");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.connection_id || !message.to_number || !message.content) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("whatsapp_messages").insert({
        connection_id: message.connection_id,
        message_type: message.message_type as any,
        from_number: "system",
        to_number: message.to_number,
        content: message.content,
        media_url: message.media_url || null,
        status: "pending"
      });

      if (error) throw error;

      toast.success("تم إرسال الرسالة بنجاح");
      setMessage({
        connection_id: "",
        to_number: "",
        message_type: "text",
        content: "",
        media_url: ""
      });
    } catch (error: any) {
      toast.error(error.message || "فشل إرسال الرسالة");
    } finally {
      setSending(false);
    }
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
        <div className="container flex h-16 items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">إرسال رسالة</h1>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-2xl">
        {connections.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <Send className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle>لا توجد اتصالات متصلة</CardTitle>
              <CardDescription>
                يجب أن يكون لديك اتصال واتساب متصل لإرسال الرسائل
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/connections")}>
                إدارة الاتصالات
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>إرسال رسالة واتساب</CardTitle>
              <CardDescription>
                أرسل رسائل نصية أو وسائط متعددة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="connection">الاتصال *</Label>
                <Select
                  value={message.connection_id}
                  onValueChange={(value) => setMessage({ ...message, connection_id: value })}
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
                <Label htmlFor="to-number">رقم المستلم *</Label>
                <Input
                  id="to-number"
                  placeholder="+966xxxxxxxxx"
                  value={message.to_number}
                  onChange={(e) => setMessage({ ...message, to_number: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message-type">نوع الرسالة</Label>
                <Select
                  value={message.message_type}
                  onValueChange={(value) => setMessage({ ...message, message_type: value })}
                >
                  <SelectTrigger id="message-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">نص</SelectItem>
                    <SelectItem value="image">صورة</SelectItem>
                    <SelectItem value="video">فيديو</SelectItem>
                    <SelectItem value="audio">صوت</SelectItem>
                    <SelectItem value="document">ملف</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {message.message_type !== "text" && (
                <div className="space-y-2">
                  <Label htmlFor="media-url">رابط الوسائط</Label>
                  <Input
                    id="media-url"
                    placeholder="https://example.com/media.jpg"
                    value={message.media_url}
                    onChange={(e) => setMessage({ ...message, media_url: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">محتوى الرسالة *</Label>
                <Textarea
                  id="content"
                  placeholder="اكتب رسالتك هنا..."
                  value={message.content}
                  onChange={(e) => setMessage({ ...message, content: e.target.value })}
                  rows={6}
                />
              </div>

              <Button 
                onClick={handleSendMessage} 
                className="w-full"
                disabled={sending}
              >
                <Send className="ml-2 h-4 w-4" />
                {sending ? "جاري الإرسال..." : "إرسال الرسالة"}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SendMessage;