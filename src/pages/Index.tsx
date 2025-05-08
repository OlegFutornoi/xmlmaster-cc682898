
// Головна сторінка - лендінг без завантаження тарифних планів
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Store, ShoppingBag, Package, Settings, ArrowRight, CheckCircle2 } from 'lucide-react';

// Компонент лендінгу для сервісу XMLMaster
const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Хедер з навігацією */}
      <header className="bg-white shadow-sm py-4 px-6 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600">XMLMaster</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/user/login')}
            >
              Увійти
            </Button>
            
            <Button 
              onClick={() => navigate('/user/register')}
            >
              Розпочати безкоштовно
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/admin/login')}
              className="text-gray-400 hover:text-gray-600"
              id="admin-login-button"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Основний контент лендінгу */}
      <main className="flex-grow">
        {/* Головний банер */}
        <section className="py-16 px-6 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-8 lg:mb-0">
              <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 text-gray-900 leading-tight">
                Керуйте товарами інтернет-магазинів <span className="text-blue-600">легко та швидко</span>
              </h1>
              <p className="text-lg mb-8 text-gray-600">
                XMLMaster — платформа для автоматичного імпорту та керування товарами з XML-фідів постачальників.
                Збільшіть свій асортимент без зайвих зусиль.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="px-8 bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate('/user/login')}
                  id="get-started-button"
                >
                  Розпочати роботу
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8"
                  onClick={() => {
                    const demoSection = document.getElementById('demo-section');
                    demoSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  id="watch-demo-button"
                >
                  Дивитися демо
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2">
              <img 
                src="/placeholder.svg" 
                alt="XMLMaster інтерфейс" 
                className="w-full h-auto rounded-lg shadow-xl" 
              />
            </div>
          </div>
        </section>

        {/* Переваги */}
        <section className="py-16 px-6 bg-white" id="features-section">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Чому обирають XMLMaster</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center">
                  <ShoppingBag className="text-blue-600 h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Автоматичний імпорт товарів</h3>
                <p className="text-gray-600">Завантажуйте та обробляйте товари з XML-файлів ваших постачальників за лічені хвилини.</p>
              </div>
              
              <div className="p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center">
                  <Store className="text-blue-600 h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Кілька магазинів</h3>
                <p className="text-gray-600">Керуйте необмеженою кількістю інтернет-магазинів з однієї зручної панелі.</p>
              </div>
              
              <div className="p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center">
                  <Package className="text-blue-600 h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Робота з постачальниками</h3>
                <p className="text-gray-600">Додавайте необмежену кількість постачальників та гнучко керуйте їх товарами.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Демо відео */}
        <section className="py-16 px-6 bg-gray-50" id="demo-section">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Подивіться як це працює</h2>
            <p className="text-lg mb-8 text-gray-600 max-w-3xl mx-auto">
              Короткий огляд функціоналу нашої платформи та її використання для керування товарами.
            </p>
            
            <div className="bg-black aspect-video max-w-4xl mx-auto rounded-lg shadow-xl overflow-hidden">
              {/* Тут буде відео */}
              <div className="flex items-center justify-center h-full bg-gray-800 text-white">
                <p>Відео демонстрація (замініть на відео)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Відгуки користувачів */}
        <section className="py-16 px-6 bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Що кажуть наші клієнти</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 border rounded-lg bg-white shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="font-bold text-blue-600">АС</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Андрій Степаненко</h4>
                    <p className="text-sm text-gray-500">Власник інтернет-магазину техніки</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "XMLMaster кардинально змінив підхід до наповнення мого магазину товарами. 
                  Тепер я економлю 20 годин щотижня і можу зосередитись на розвитку бізнесу."
                </p>
              </div>
              
              <div className="p-6 border rounded-lg bg-white shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="font-bold text-blue-600">ОВ</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Олена Вишневська</h4>
                    <p className="text-sm text-gray-500">Керівник відділу маркетингу</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "Жодних більше проблем з оновленням цін та наявністю товарів. 
                  XMLMaster вирішує ці питання автоматично, що допомагає нам уникнути конфліктів з клієнтами."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Заклик до дії */}
        <section className="py-16 px-6 bg-blue-600 text-white">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Готові спростити керування вашими товарами?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Приєднуйтесь до тисяч власників інтернет-магазинів, які вже оптимізували свої процеси з XMLMaster.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="px-8 bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => navigate('/user/login')}
              id="cta-button"
            >
              Розпочати безкоштовно
            </Button>
          </div>
        </section>
      </main>

      {/* Футер */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">XMLMaster</h3>
              <p className="text-gray-400 mb-4">
                Платформа для автоматизації імпорту та керування товарами інтернет-магазинів.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Функціонал</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Імпорт XML</li>
                <li>Керування магазинами</li>
                <li>Робота з постачальниками</li>
                <li>Фільтрація товарів</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Компанія</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Про нас</li>
                <li>Блог</li>
                <li>Умови використання</li>
                <li>Політика конфіденційності</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Контакти</h3>
              <ul className="space-y-2 text-gray-400">
                <li>info@xmlmaster.ua</li>
                <li>+380 67 123 4567</li>
                <li>м. Київ, вул. Хрещатик, 1</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2025 XMLMaster. Усі права захищено.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
