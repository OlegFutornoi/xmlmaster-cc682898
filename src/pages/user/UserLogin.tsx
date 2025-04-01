
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle } from "lucide-react";

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
        // Toast is shown in the login function
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Вхід в кабінет користувача</CardTitle>
            <CardDescription className="text-center">
              Введіть ваші облікові дані для входу
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/15 p-3 rounded-md flex items-center text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Пароль</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Вхід..." : "Увійти"}
              </Button>
              <div className="text-center text-sm">
                Немає облікового запису?{" "}
                <Link to="/user/register" className="text-blue-600 hover:text-blue-800 font-semibold">
                  Зареєструватися
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-800">
            Повернутися на головну
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
