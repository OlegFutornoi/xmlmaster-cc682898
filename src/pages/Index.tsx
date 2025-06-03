
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
  Settings
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
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Анімований фоновий ефект */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-400/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-green-600/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Фіксоване меню */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md border-b border-green-500/20' : 'bg-transparent'}`}>
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-green-400" id="logo">
            XML Master
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="hover:text-green-400 transition-colors" id="nav-features">Функції</a>
            <a href="#demo" className="hover:text-green-400 transition-colors" id="nav-demo">Демо</a>
            <a href="#testimonials" className="hover:text-green-400 transition-colors" id="nav-testimonials">Відгуки</a>
            <a href="#pricing" className="hover:text-green-400 transition-colors" id="nav-pricing">Тарифи</a>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/admin/login">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all duration-300"
                id="admin-login-btn"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/user/login">
              <Button 
                className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                id="user-login-btn"
              >
                Увійти
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Головний блок */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent" id="main-title">
              XML Master
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed" id="main-description">
              Потужний інструмент для автоматизації роботи з XML файлами постачальників та інтеграції з вашим інтернет-магазином
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link to="/user/register">
                <Button 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
                  id="get-started-btn"
                >
                  Почати роботу
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="border-green-500 text-green-400 hover:bg-green-500 hover:text-black px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
                id="watch-demo-btn"
              >
                <Play className="mr-2 w-5 h-5" />
                Дивитися демо
              </Button>
            </div>

            {/* Центральне демо-відео */}
            <div className="relative max-w-4xl mx-auto">
              <Card className="bg-gray-900/50 border-green-500/20 backdrop-blur-sm shadow-2xl">
                <CardContent className="p-2">
                  <div className="relative rounded-lg overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop"
                      alt="XML Master Demo"
                      className="w-full h-[400px] object-cover"
                      id="main-demo-image"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Button 
                        size="lg"
                        className="bg-green-500/90 hover:bg-green-500 text-black rounded-full p-6 transition-all duration-300 transform hover:scale-110"
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
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-green-400" id="features-title">
            Ключові можливості
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-green-500/20 backdrop-blur-sm hover:border-green-500/40 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/10"
                id={`feature-card-${index}`}
              >
                <CardContent className="p-8 text-center">
                  <div className="text-green-400 mb-4 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-white">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Слайдер відео-презентації */}
      <section id="demo" className="py-20 px-4 bg-gradient-to-r from-gray-900/50 to-black/50">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-green-400" id="video-slider-title">
            Як це працює
          </h2>
          
          <div className="relative max-w-4xl mx-auto">
            <Card className="bg-gray-900/80 border-green-500/20 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-6">
                <div className="relative rounded-lg overflow-hidden mb-6">
                  <img 
                    src={videoSlides[currentVideoSlide].thumbnail}
                    alt={videoSlides[currentVideoSlide].title}
                    className="w-full h-[300px] object-cover"
                    id={`video-slide-${currentVideoSlide}`}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Button 
                      className="bg-green-500/90 hover:bg-green-500 text-black rounded-full p-4"
                      id={`play-video-${currentVideoSlide}`}
                    >
                      <Play className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2 text-green-400">
                    {videoSlides[currentVideoSlide].title}
                  </h3>
                  <p className="text-gray-300">
                    {videoSlides[currentVideoSlide].description}
                  </p>
                </div>
                
                <div className="flex justify-between items-center mt-6">
                  <Button 
                    variant="ghost"
                    onClick={() => setCurrentVideoSlide((prev) => (prev - 1 + videoSlides.length) % videoSlides.length)}
                    className="text-green-400 hover:bg-green-500/10"
                    id="prev-video-btn"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  
                  <div className="flex space-x-2">
                    {videoSlides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentVideoSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentVideoSlide ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                        id={`video-indicator-${index}`}
                      />
                    ))}
                  </div>
                  
                  <Button 
                    variant="ghost"
                    onClick={() => setCurrentVideoSlide((prev) => (prev + 1) % videoSlides.length)}
                    className="text-green-400 hover:bg-green-500/10"
                    id="next-video-btn"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Слайдер відгуків */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-green-400" id="testimonials-title">
            Що кажуть наші клієнти
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-green-500/20 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <img 
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name}
                    className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-green-500"
                    id={`testimonial-avatar-${currentTestimonial}`}
                  />
                  
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <blockquote className="text-2xl font-bold text-green-400 mb-4">
                    "{testimonials[currentTestimonial].quote}"
                  </blockquote>
                  
                  <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                    {testimonials[currentTestimonial].review}
                  </p>
                  
                  <div>
                    <h4 className="text-xl font-bold text-white">
                      {testimonials[currentTestimonial].name}
                    </h4>
                    <p className="text-green-400">
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
                        index === currentTestimonial ? 'bg-green-500' : 'bg-gray-600'
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
      <section className="py-20 px-4 bg-gradient-to-r from-green-900/20 to-black/20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-green-400" id="cta-title">
            Готові розпочати?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto" id="cta-description">
            Приєднуйтеся до тисяч задоволених користувачів та автоматизуйте свій бізнес вже сьогодні
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/user/register">
              <Button 
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-bold px-12 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
                id="cta-register-btn"
              >
                Розпочати безкоштовно
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/user/login">
              <Button 
                variant="outline" 
                className="border-green-500 text-green-400 hover:bg-green-500 hover:text-black px-12 py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
                id="cta-login-btn"
              >
                Увійти в кабінет
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="py-12 px-4 border-t border-green-500/20 bg-black/50">
        <div className="container mx-auto text-center">
          <div className="text-2xl font-bold text-green-400 mb-4" id="footer-logo">
            XML Master
          </div>
          <p className="text-gray-400 mb-6">
            Ефективний інструмент для обробки XML файлів та інтеграції з інтернет-магазинами
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <a href="#" className="hover:text-green-400 transition-colors">Про нас</a>
            <a href="#" className="hover:text-green-400 transition-colors">Контакти</a>
            <a href="#" className="hover:text-green-400 transition-colors">Підтримка</a>
            <a href="#" className="hover:text-green-400 transition-colors">Політика конфіденційності</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
