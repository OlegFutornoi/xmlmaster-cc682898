
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AlertCircle } from "lucide-react";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAdminAuth();

  // Redirect to dashboard if already authenticated
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
        // Toast is already shown in the login function
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-white">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Вхід в кабінет адміністратора</CardTitle>
            <CardDescription className="text-center">
              Будь ласка, введіть ваші облікові дані
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
                <Label htmlFor="username">Ім'я користувача</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
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

export default AdminLogin;
