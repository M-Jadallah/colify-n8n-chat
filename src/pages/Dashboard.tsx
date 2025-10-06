import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Zap, Send, LogOut } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/auth");
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
          <h1 className="text-2xl font-bold">منصة واتساب</h1>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="ml-2 h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">مرحباً بك!</h2>
          <p className="text-muted-foreground">إدارة وأتمتة رسائل واتساب الخاصة بك</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => navigate("/connections")}>
            <CardHeader>
              <MessageSquare className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>اتصالات واتساب</CardTitle>
              <CardDescription>
                ربط حسابات واتساب عبر QR Code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">إدارة الاتصالات</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => navigate("/triggers")}>
            <CardHeader>
              <Zap className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>المحفزات والأتمتة</CardTitle>
              <CardDescription>
                إنشاء محفزات آلية وربطها مع n8n
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">إدارة المحفزات</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => navigate("/send-message")}>
            <CardHeader>
              <Send className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>إرسال رسائل</CardTitle>
              <CardDescription>
                إرسال رسائل نصية ووسائط متعددة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">إرسال رسالة</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;