
import React, { useRef, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ChevronDown, Star, ShieldCheck, Package, Settings, Lock, Rocket, Clock, CheckCircle2, Users, ShoppingCart, ExternalLink, UserCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePlanDetails } from "@/hooks/tariffs/usePlanDetails";

// Компонент анімованого заголовка
const AnimatedTitle = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

// Компонент анімованої секції, яка з'являється при скролі
const AnimatedSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay: delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

// Компонент для паралакс-ефекту
const ParallaxImage = ({ src, alt, speed = 0.2 }: { src: string; alt: string; speed?: number }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ 
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 100 * speed]);
  
  return (
    <motion.div ref={ref} className="overflow-hidden rounded-xl" style={{ y }}>
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </motion.div>
  );
};

// Компонент анімованого числа для лічильників
const AnimatedCounter = ({ value, text }: { value: number; text: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (isInView) {
      let startValue = 0;
      const duration = 1500;
      const step = Math.floor(duration / value);
      
      const counter = setInterval(() => {
        startValue += 1;
        setCount(startValue);
        
        if (startValue === value) {
          clearInterval(counter);
        }
      }, step);
      
      return () => clearInterval(counter);
    }
  }, [isInView, value]);
  
  return (
    <div ref={ref} className="flex flex-col items-center">
      <span className="text-4xl font-bold text-blue-600">{count}+</span>
      <span className="text-gray-600 text-sm mt-1">{text}</span>
    </div>
  );
};

// Дані для відгуків (пізніше можна буде завантажувати з бази даних)
const testimonials = [
  {
    id: 1,
    name: "Марія Петренко",
    company: "Fashion Shop",
    image: "https://randomuser.me/api/portraits/women/32.jpg",
    text: "XML Master дозволив нам автоматизувати імпорт товарів від постачальників. Це економить нам більше 20 годин роботи щотижня!",
    rating: 5
  },
  {
    id: 2,
    name: "Олександр Коваленко",
    company: "Tech Store",
    image: "https://randomuser.me/api/portraits/men/42.jpg",
    text: "Раніше ми витрачали дні на обробку файлів постачальників. Тепер це займає лише кілька хвилин. Дуже рекомендую цей сервіс!",
    rating: 5
  },
  {
    id: 3,
    name: "Ірина Мельник",
    company: "Home Goods",
    image: "https://randomuser.me/api/portraits/women/45.jpg",
    text: "Зручний інтерфейс та швидка підтримка. Сервіс значно спростив нашу роботу з постачальниками.",
    rating: 4
  }
];

// Дані для тарифів (пізніше можна буде завантажувати з бази даних)
const pricingPlans = [
  {
    id: "starter",
    name: "Стартовий",
    price: 199,
    currency: "грн",
    period: "міс",
    description: "Ідеально підходить для малого бізнесу, що тільки починає.",
    features: [
      "До 3 постачальників",
      "До 2 магазинів",
      "Базове картування полів",
      "Щоденне оновлення",
      "Базова підтримка"
    ],
    popular: false
  },
  {
    id: "business",
    name: "Бізнес",
    price: 499,
    currency: "грн",
    period: "міс",
    description: "Оптимальне рішення для середнього бізнесу з кількома постачальниками.",
    features: [
      "До 8 постачальників",
      "До 5 магазинів",
      "Розширене картування полів",
      "Оновлення кожні 12 годин",
      "Пріоритетна підтримка",
      "Аналітика і звіти"
    ],
    popular: true
  },
  {
    id: "premium",
    name: "Преміум",
    price: 999,
    currency: "грн",
    period: "міс",
    description: "Повний набір функцій для великого бізнесу з численними постачальниками.",
    features: [
      "Необмежена кількість постачальників",
      "До 10 магазинів",
      "Повне налаштування картування",
      "Оновлення щогодини",
      "Підтримка 24/7",
      "Розширена аналітика",
      "API доступ"
    ],
    popular: false
  }
];

// Компонент для відображення відгуку
const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
  <Card className="h-full">
    <CardContent className="pt-6 pb-4">
      <div className="flex items-center mb-4">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={testimonial.image} alt={testimonial.name} />
          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{testimonial.name}</p>
          <p className="text-sm text-muted-foreground">{testimonial.company}</p>
        </div>
      </div>
      <div className="flex mb-3">
        {Array(5).fill(0).map((_, i) => (
          <Star 
            key={i} 
            size={16} 
            className={i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
          />
        ))}
      </div>
      <p className="text-gray-600">{testimonial.text}</p>
    </CardContent>
  </Card>
);

// Компонент для відображення тарифного плану
const PricingCard = ({ plan, onSelect }: { plan: typeof pricingPlans[0], onSelect: () => void }) => (
  <Card className={`h-full transition-all duration-200 hover:shadow-lg ${plan.popular ? 'border-blue-600 border-2' : ''}`}>
    {plan.popular && (
      <div className="absolute -top-3 inset-x-0 flex justify-center">
        <Badge className="bg-blue-600 hover:bg-blue-700">Найпопулярніший</Badge>
      </div>
    )}
    <CardHeader>
      <CardTitle className="text-xl">{plan.name}</CardTitle>
      <CardDescription>{plan.description}</CardDescription>
      <div className="mt-4">
        <span className="text-3xl font-bold">{plan.price}</span>
        <span className="text-gray-500 ml-1">{plan.currency}/{plan.period}</span>
      </div>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <CheckCircle2 size={16} className="text-green-500 mr-2" />
            <span className="text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
    </CardContent>
    <CardFooter>
      <Button 
        onClick={onSelect} 
        className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
        id={`select-plan-${plan.id}`}
      >
        Обрати тариф
      </Button>
    </CardFooter>
  </Card>
);

// Компонент для відображення функціональності
const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string 
}) => (
  <Card className="h-full transition-all duration-200 hover:shadow-md">
    <CardHeader>
      <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-3 text-blue-600">
        {icon}
      </div>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-600">{description}</p>
    </CardContent>
  </Card>
);

// Головний компонент сторінки
const Index = () => {
  const navigate = useNavigate();
  const { planLimitations } = usePlanDetails("business-plan-id"); // Змініть на реальний ID тарифу
  
  const handleSelectPlan = () => {
    navigate("/user/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Шапка сайту */}
      <header className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex justify-between items-center py-4 px-4">
          <div className="flex items-center">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 32 32" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-blue-600"
            >
              <rect x="4" y="4" width="24" height="24" rx="12" fill="currentColor" fillOpacity="0.2" />
              <path d="M21 10L14 22L11 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 14L12 17L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className="ml-2 text-xl font-bold text-blue-700">XML Master</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" asChild>
              <Link to="#features">Можливості</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="#pricing">Тарифи</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="#testimonials">Відгуки</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/user/login">Увійти</Link>
            </Button>
            <Button asChild>
              <Link to="/user/login">Спробувати безкоштовно</Link>
            </Button>
            {/* Кнопка для входу в адмінку */}
            <Button 
              variant="ghost" 
              size="icon" 
              asChild 
              title="Адмін панель"
              className="rounded-full w-8 h-8 p-0 ml-2"
            >
              <Link to="/admin/login">
                <UserCircle size={18} className="text-gray-500" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Головний банер */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <AnimatedTitle>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                  Автоматизуйте імпорт товарів від постачальників
                </h1>
              </AnimatedTitle>
              <motion.p 
                className="text-xl text-gray-600 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              >
                XML Master допомагає інтернет-магазинам автоматично імпортувати та оновлювати товари від постачальників, економлячи час та уникаючи помилок.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              >
                <Button size="lg" asChild className="px-6">
                  <Link to="/user/login">Спробувати безкоштовно</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="#demo">Дивитись демо</Link>
                </Button>
              </motion.div>
            </div>
            <motion.div 
              className="hidden lg:block relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&q=80&w=2662" 
                alt="XML Master інтерфейс" 
                className="rounded-xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-blue-600 rounded-xl opacity-10"></div>
              <div className="absolute top-4 right-4 bg-white rounded-full p-3 shadow-lg">
                <Package className="text-blue-600 h-6 w-6" />
              </div>
              <div className="absolute bottom-4 left-4 bg-white rounded-full p-3 shadow-lg">
                <ShoppingCart className="text-green-600 h-6 w-6" />
              </div>
            </motion.div>
          </div>
        </div>
        <motion.div 
          className="flex justify-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <Link to="#features" className="text-gray-500 flex flex-col items-center">
            <span className="text-sm mb-1">Дізнатись більше</span>
            <ChevronDown className="animate-bounce" />
          </Link>
        </motion.div>
      </section>
      
      {/* Секція статистики */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <AnimatedCounter value={50} text="Постачальників" />
            <AnimatedCounter value={1000} text="Магазинів" />
            <AnimatedCounter value={5000000} text="Імпортованих товарів" />
            <AnimatedCounter value={98} text="Задоволених клієнтів (%)" />
          </div>
        </div>
      </section>
      
      {/* Секція особливостей/функцій */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-4">Перетворіть процес імпорту товарів</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                XML Master автоматизує всі етапи роботи з каталогами постачальників, 
                заощаджуючи ваш час та зменшуючи помилки.
              </p>
            </AnimatedSection>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedSection delay={0.1}>
              <FeatureCard 
                icon={<Package />}
                title="Підключення постачальників"
                description="Швидко підключайте будь-яких постачальників з XML, CSV або JSON файлами."
              />
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <FeatureCard 
                icon={<Settings />}
                title="Гнучке налаштування полів"
                description="Налаштуйте відповідність полів між форматом постачальника та вашим магазином."
              />
            </AnimatedSection>
            <AnimatedSection delay={0.3}>
              <FeatureCard 
                icon={<ShoppingCart />}
                title="Інтеграція з магазинами"
                description="Готові інтеграції з WooCommerce, Shopify, Opencart, PrestaShop та іншими."
              />
            </AnimatedSection>
            <AnimatedSection delay={0.4}>
              <FeatureCard 
                icon={<Lock />}
                title="Захист даних"
                description="Усі дані зашифровані та доступні тільки вам через захищене з'єднання."
              />
            </AnimatedSection>
            <AnimatedSection delay={0.5}>
              <FeatureCard 
                icon={<Clock />}
                title="Автоматичні оновлення"
                description="Налаштуйте розклад оновлення товарів відповідно до ваших потреб."
              />
            </AnimatedSection>
            <AnimatedSection delay={0.6}>
              <FeatureCard 
                icon={<Users />}
                title="Командний доступ"
                description="Надавайте різні рівні доступу членам вашої команди для співпраці."
              />
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* Відео-демонстрація */}
      <section id="demo" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-4">Подивіться XML Master в дії</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Коротке демо основних функцій платформи
              </p>
            </AnimatedSection>
          </div>
          
          <AnimatedSection>
            <div className="max-w-4xl mx-auto overflow-hidden rounded-xl shadow-2xl">
              <div className="relative pb-[56.25%] bg-gray-900">
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                  title="XML Master Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
      
      {/* Як це працює */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-4">Як це працює</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Простий процес в три кроки для налаштування автоматизованого імпорту
              </p>
            </AnimatedSection>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <AnimatedSection delay={0.1}>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Підключіть постачальників</h3>
                <p className="text-gray-600">
                  Додайте файли ваших постачальників через URL або завантажте їх вручну.
                </p>
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={0.2}>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Налаштуйте картування</h3>
                <p className="text-gray-600">
                  Вкажіть, як поля з файлів постачальників відповідають полям вашого магазину.
                </p>
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={0.3}>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Імпортуйте товари</h3>
                <p className="text-gray-600">
                  Запустіть імпорт та насолоджуйтесь автоматичним оновленням товарів.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* Тарифні плани */}
      <section id="pricing" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-4">Прозорі тарифні плани</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Оберіть тарифний план, який найкраще підходить для вашого бізнесу
              </p>
            </AnimatedSection>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <AnimatedSection key={plan.id} delay={index * 0.1}>
                <div className="relative">
                  <PricingCard plan={plan} onSelect={handleSelectPlan} />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
      
      {/* Відгуки клієнтів */}
      <section id="testimonials" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-4">Відгуки клієнтів</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Що кажуть користувачі XML Master про нашу платформу
              </p>
            </AnimatedSection>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <AnimatedSection key={testimonial.id} delay={index * 0.1}>
                <TestimonialCard testimonial={testimonial} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
      
      {/* Заклик до дії */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-6">Готові автоматизувати імпорт товарів?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Почніть використовувати XML Master вже сьогодні та забудьте про ручне оновлення каталогів
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              asChild 
              className="bg-white text-blue-700 hover:bg-gray-100"
            >
              <Link to="/user/login" className="px-8 py-6">
                Почати безкоштовно
              </Link>
            </Button>
          </AnimatedSection>
        </div>
      </section>
      
      {/* Футер */}
      <footer className="py-12 bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 32 32" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-blue-400"
                >
                  <rect x="4" y="4" width="24" height="24" rx="12" fill="currentColor" fillOpacity="0.2" />
                  <path d="M21 10L14 22L11 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 14L12 17L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h2 className="ml-2 text-xl font-bold text-white">XML Master</h2>
              </div>
              <p className="text-gray-400">
                Платформа для автоматизації імпорту товарів від постачальників до вашого інтернет-магазину.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Функції</h3>
              <ul className="space-y-2">
                <li><Link to="#" className="hover:text-white">Імпорт товарів</Link></li>
                <li><Link to="#" className="hover:text-white">Картування полів</Link></li>
                <li><Link to="#" className="hover:text-white">Оновлення цін</Link></li>
                <li><Link to="#" className="hover:text-white">Інтеграції</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Компанія</h3>
              <ul className="space-y-2">
                <li><Link to="#" className="hover:text-white">Про нас</Link></li>
                <li><Link to="#" className="hover:text-white">Блог</Link></li>
                <li><Link to="#" className="hover:text-white">Кар'єра</Link></li>
                <li><Link to="#" className="hover:text-white">Контакти</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Зв'язатися з нами</h3>
              <p className="text-gray-400 mb-4">Залишайтеся на зв'язку з нами у соціальних мережах</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10 10 0 01-3.127 1.184A4.92 4.92 0 0012.05 5.8 4.9 4.9 0 0011.441 8a13.94 13.94 0 01-10.12-5.13 4.93 4.93 0 001.523 6.57A4.9 4.9 0 011 9.27v.07a4.92 4.92 0 003.93 4.835 4.97 4.97 0 01-2.22.08 4.92 4.92 0 004.6 3.42A9.86 9.86 0 010 19.95a13.91 13.91 0 007.548 2.21c9.057 0 14.01-7.5 14.01-14 0-.21 0-.42-.016-.63A10 10 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
            <p>© 2025 XML Master. Усі права захищені.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
