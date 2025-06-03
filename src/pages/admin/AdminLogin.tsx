
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AlertCircle, Shield, Database, Settings, Users } from "lucide-react";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAdminAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    console.log("Login attempt with:", { username, passwordLength: password.length });
    
    if (!username || !password) {
      setError("Будь ласка, введіть ім'я користувача та пароль");
      toast({
        title: "Помилка входу",
        description: "Будь ласка, введіть ім'я користувача та пароль",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Attempting login...");
      const success = await login(username, password);
      
      console.log("Login result:", success);
      
      if (success) {
        toast({
          title: "Успішний вхід",
          description: "Ви успішно увійшли в адмін-панель",
        });
        navigate("/admin/dashboard");
      } else {
        setError("Невірне ім'я користувача або пароль");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Виникла помилка при вході в систему");
      toast({
        title: "Помилка входу",
        description: "Виникла помилка при вході в систему",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="flex min-h-screen">
        {/* Left Side - Admin Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-indigo-900/20 to-slate-900/20"></div>
          <div className="relative z-10 flex flex-col justify-center items-start p-12 text-white">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold mb-6">Адміністративна панель</h1>
              <p className="text-xl mb-8 opacity-90">
                Повний контроль та управління системою XML Master
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Управління користувачами</h3>
                    <p className="text-sm opacity-80">Контроль доступу та ролей</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Управління тарифами</h3>
                    <p className="text-sm opacity-80">Налаштування планів та обмежень</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Системні налаштування</h3>
                    <p className="text-sm opacity-80">Конфігурація та моніторинг</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 right-32 w-24 h-24 bg-indigo-500/10 rounded-full blur-lg"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Вхід адміністратора</h2>
              <p className="text-gray-600">Увійдіть до адміністративної панелі</p>
            </div>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <form onSubmit={handleSubmit}>
                <CardContent className="p-8 space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-700 font-medium">Ім'я користувача</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Введіть ім'я користувача"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 border-gray-200 focus:border-slate-400 focus:ring-slate-400"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Пароль</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Введіть пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 border-gray-200 focus:border-slate-400 focus:ring-slate-400"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02]" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                        Вхід...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Увійти
                      </div>
                    )}
                  </Button>
                </CardContent>
              </form>
            </Card>
            
            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                ← Повернутися на головну
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
