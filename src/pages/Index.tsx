
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Play, 
  Star, 
  Shield, 
  Zap, 
  Database,
  ChevronLeft,
  ChevronRight,
  Settings,
  CheckCircle,
  Users,
  BarChart3
} from "lucide-react";
import { useState, useEffect } from "react";

const Index = () => {
  const [currentVideoSlide, setCurrentVideoSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Відео слайди для демонстрації функціоналу
  const videoSlides = [
    {
      id: 1,
      title: "Імпорт XML файлів",
      description: "Швидка обробка великих файлів постачальників",
      thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop"
    },
    {
      id: 2,
      title: "Інтеграція з магазином",
      description: "Автоматичне оновлення товарів та цін",
      thumbnail: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=450&fit=crop"
    },
    {
      id: 3,
      title: "Аналітика та звіти",
      description: "Детальна статистика продажів та оновлень",
      thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop"
    }
  ];

  // Відгуки користувачів
  const testimonials = [
    {
      id: 1,
      name: "Олександр Петров",
      position: "Власник інтернет-магазину",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      quote: "Ефективний інструмент",
      review: "XML Master значно спростив роботу з постачальниками. Автоматизація імпорту заощаджує години щодня!"
    },
    {
      id: 2,
      name: "Марія Коваленко",
      position: "Менеджер з закупівель",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1e1?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      quote: "Надійність та швидкість",
      review: "Програма працює стабільно навіть з великими обсягами даних. Рекомендую всім колегам!"
    },
    {
      id: 3,
      name: "Дмитро Сидоренко",
      position: "IT-директор",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      quote: "Технологічне рішення",
      review: "Інтеграція пройшла без проблем. Система автоматично синхронізує дані з нашими постачальниками."
    }
  ];

  // Функції та переваги
  const features = [
    {
      icon: <Database className="w-8 h-8" />,
      title: "Обробка XML",
      description: "Швидкий парсинг та валідація XML файлів від постачальників"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Автоматизація",
      description: "Автоматичне оновлення товарів, цін та залишків"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Надійність",
      description: "Захищена передача даних та резервне копіювання"
    }
  ];

  // Статистика
  const stats = [
    { number: "10K+", label: "Активних користувачів" },
    { number: "1M+", label: "Оброблених файлів" },
    { number: "99.9%", label: "Час роботи" },
    { number: "24/7", label: "Підтримка" }
  ];

  // Скрол ефект для хедера
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Автоматична зміна слайдів
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoSlide((prev) => (prev + 1) % videoSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Автоматична зміна відгуків
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Фіксоване меню */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200' : 'bg-transparent'}`}>
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent" id="logo">
            XML Master
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium" id="nav-features">Функції</a>
            <a href="#demo" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium" id="nav-demo">Демо</a>
            <a href="#testimonials" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium" id="nav-testimonials">Відгуки</a>
            <a href="#pricing" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium" id="nav-pricing">Тарифи</a>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/admin/login">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
                id="admin-login-btn"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/user/login">
              <Button 
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all duration-300"
                id="login-btn"
              >
                Увійти
              </Button>
            </Link>
            <Link to="/user/register">
              <Button 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold transition-all duration-300 transform hover:scale-105"
                id="register-btn"
              >
                Розпочати
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Головний блок */}
      <section className="pt-24 pb-20 px-6">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-8">
              <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                ✨ Новий рівень автоматизації XML
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" id="main-title">
              Революційний підхід до 
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"> роботи з XML</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed" id="main-description">
              Автоматизуйте імпорт, обробку та синхронізацію XML файлів з вашими постачальниками. 
              Заощаджуйте години роботи щодня.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link to="/user/register">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-8 py-4 text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
                  id="get-started-btn"
                >
                  Розпочати безкоштовно
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-600 px-8 py-4 text-lg transition-all duration-300"
                id="watch-demo-btn"
              >
                <Play className="mr-2 w-5 h-5" />
                Дивитися демо
              </Button>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">{stat.number}</div>
                  <div className="text-gray-600 text-sm md:text-base">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Центральне демо-зображення */}
            <div className="relative max-w-5xl mx-auto">
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-50 to-white overflow-hidden">
                <CardContent className="p-4">
                  <div className="relative rounded-lg overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop"
                      alt="XML Master Interface"
                      className="w-full h-[400px] object-cover"
                      id="main-demo-image"
                    />
                    <div className="absolute inset-0 bg-emerald-600/10 flex items-center justify-center">
                      <Button 
                        size="lg"
                        className="bg-white/90 hover:bg-white text-emerald-600 rounded-full p-6 transition-all duration-300 transform hover:scale-110 shadow-lg"
                        id="play-demo-btn"
                      >
                        <Play className="w-8 h-8" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Блок функцій */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" id="features-title">
              Чому обирають XML Master?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ми створили найпотужніший інструмент для роботи з XML файлами, 
              який поєднує простоту використання з професійними можливостями.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                id={`feature-card-${index}`}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <div className="text-emerald-600">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Переваги */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                Автоматизація, яка 
                <span className="text-emerald-600"> дійсно працює</span>
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Швидка обробка великих файлів</h3>
                    <p className="text-gray-600">Обробляйте XML файли розміром до 100MB за лічені секунди</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Інтеграція з популярними платформами</h3>
                    <p className="text-gray-600">WooCommerce, Shopify, OpenCart та інші</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Розумне мапування полів</h3>
                    <p className="text-gray-600">ШІ автоматично розпізнає структуру ваших XML файлів</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=600&h=400&fit=crop"
                alt="XML Processing"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl opacity-80"></div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl opacity-60"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Відгуки */}
      <section id="testimonials" className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" id="testimonials-title">
              Що кажуть наші клієнти
            </h2>
            <p className="text-xl text-gray-600">
              Приєднуйтесь до тисяч задоволених користувачів
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl bg-white">
              <CardContent className="p-12">
                <div className="text-center">
                  <img 
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name}
                    className="w-20 h-20 rounded-full mx-auto mb-6 ring-4 ring-emerald-100"
                    id={`testimonial-avatar-${currentTestimonial}`}
                  />
                  
                  <div className="flex justify-center mb-6">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <blockquote className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    "{testimonials[currentTestimonial].quote}"
                  </blockquote>
                  
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                    {testimonials[currentTestimonial].review}
                  </p>
                  
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {testimonials[currentTestimonial].name}
                    </h4>
                    <p className="text-emerald-600 font-medium">
                      {testimonials[currentTestimonial].position}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-center mt-8 space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentTestimonial ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                      id={`testimonial-indicator-${index}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Заклик до дії */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white" id="cta-title">
            Готові розпочати свою автоматизацію?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto" id="cta-description">
            Приєднуйтесь до тисяч компаній, які вже автоматизували свою роботу з XML Master
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/user/register">
              <Button 
                size="lg"
                className="bg-white text-emerald-600 hover:bg-gray-100 font-bold px-12 py-4 text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                id="cta-register-btn"
              >
                Розпочати безкоштовно
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/user/login">
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 px-12 py-4 text-lg transition-all duration-300"
                id="cta-login-btn"
              >
                Увійти в кабінет
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4" id="footer-logo">
                XML Master
              </div>
              <p className="text-gray-400">
                Ефективний інструмент для обробки XML файлів та інтеграції з інтернет-магазинами
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Продукт</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Функції</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Тарифи</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">API</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Інтеграції</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Компанія</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Про нас</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Блог</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Кар'єра</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Контакти</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Підтримка</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Документація</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Підтримка</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Статус</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Безпека</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 XML Master. Всі права захищені.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
              <a href="#" className="hover:text-emerald-400 transition-colors">Політика конфіденційності</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Умови використання</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
