
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, UserPlus, Shield, Zap } from "lucide-react";

const UserRegister = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !password || !confirmPassword) {
      toast({
        title: "Помилка реєстрації",
        description: "Будь ласка, заповніть всі поля",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Помилка реєстрації",
        description: "Паролі не співпадають",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await register(username, email, password);
      
      if (success) {
        toast({
          title: "Успішна реєстрація",
          description: "Ви успішно зареєструвалися. Очікуйте на підтвердження від адміністратора.",
        });
        navigate("/user/login");
      } else {
        toast({
          title: "Помилка реєстрації",
          description: "Виникла помилка при реєстрації",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Помилка реєстрації",
        description: error.message || "Виникла помилка при реєстрації",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      <div className="flex min-h-screen">
        {/* Left Side - Registration Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Створити акаунт</h2>
              <p className="text-gray-600">Приєднуйтесь до XML Master сьогодні</p>
            </div>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <form onSubmit={handleSubmit}>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-700 font-medium">Ім'я користувача</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Введіть ім'я користувача"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
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
                      placeholder="Створіть надійний пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Підтвердіть пароль</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Повторіть пароль"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                        Реєстрація...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Зареєструватися
                      </div>
                    )}
                  </Button>
                  
                  <div className="text-center text-sm">
                    <span className="text-gray-600">Вже маєте обліковий запис? </span>
                    <Link to="/user/login" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
                      Увійти
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

        {/* Right Side - Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col justify-center items-start p-12 text-white">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold mb-6">Приєднуйтесь до нас</h1>
              <p className="text-xl mb-8 opacity-90">
                Отримайте доступ до потужних інструментів для роботи з XML
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Швидкий старт</h3>
                    <p className="text-sm opacity-80">Розпочніть роботу за лічені хвилини</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Надійність</h3>
                    <p className="text-sm opacity-80">Ваші дані захищені та в безпеці</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Підтримка</h3>
                    <p className="text-sm opacity-80">Цілодобова технічна підтримка</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 left-32 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default UserRegister;
