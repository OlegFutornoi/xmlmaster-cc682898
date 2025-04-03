
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center max-w-3xl px-4">
        <h1 className="text-4xl font-bold mb-4 text-blue-700">XML Master</h1>
        <p className="text-xl text-gray-600 mb-8">
          Ефективний інструмент для обробки XML файлів постачальників та інтеграції з вашим інтернет-магазином
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/user/login">
            <Button className="w-full sm:w-auto px-8">
              Кабінет користувача
            </Button>
          </Link>
          <Link to="/admin/login">
            <Button variant="outline" className="w-full sm:w-auto px-8">
              Кабінет адміністратора
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
