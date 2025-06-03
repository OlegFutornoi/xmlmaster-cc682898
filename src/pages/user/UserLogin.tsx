
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, ArrowRight, LogIn } from "lucide-react";

const UserLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    console.log("User login attempt with:", { email, passwordLength: password.length });
    
    if (!email || !password) {
      setError("Будь ласка, введіть email та пароль");
      toast({
        title: "Помилка входу",
        description: "Будь ласка, введіть email та пароль",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Attempting user login...");
      const success = await login(email, password);
      
      console.log("User login result:", success);
      
      if (success) {
        toast({
          title: "Успішний вхід",
          description: "Ви успішно увійшли в систему",
        });
        navigate("/user/dashboard");
      } else {
        setError("Невірний email або пароль");
      }
    } catch (error) {
      console.error("User login error:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col justify-center items-start p-12 text-white">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold mb-6">XML Master</h1>
              <p className="text-xl mb-8 opacity-90">
                Потужний інструмент для автоматизації роботи з XML файлами
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Швидка обробка XML</h3>
                    <p className="text-sm opacity-80">Автоматичний парсинг та валідація файлів</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Інтеграція з магазинами</h3>
                    <p className="text-sm opacity-80">Автоматичне оновлення товарів та цін</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 right-32 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Ласкаво просимо</h2>
              <p className="text-gray-600">Введіть ваші облікові дані для входу</p>
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
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Введіть ваш email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Пароль</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Введіть ваш пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02]" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                        Вхід...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <LogIn className="w-4 h-4 mr-2" />
                        Увійти
                      </div>
                    )}
                  </Button>
                  
                  <div className="text-center text-sm">
                    <span className="text-gray-600">Немає облікового запису? </span>
                    <Link to="/user/register" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
                      Зареєструватися
                    </Link>
                  </div>
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

export default UserLogin;
