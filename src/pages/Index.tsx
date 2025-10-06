import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="text-center space-y-6 p-8">
        <MessageSquare className="h-24 w-24 mx-auto text-primary" />
        <h1 className="text-5xl font-bold">منصة واتساب</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          إدارة وأتمتة رسائل واتساب الخاصة بك بسهولة مع دعم n8n والمحفزات الذكية
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/auth")}>
            تسجيل الدخول
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
            إنشاء حساب
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
