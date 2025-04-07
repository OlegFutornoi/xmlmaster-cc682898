
// Компонент для відображення та завантаження аватару користувача
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  showUpload?: boolean;
  showStatus?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  size = 'md', 
  showUpload = false,
  showStatus = false 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);

  // Визначення розміру на основі пропсів
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14'
  };

  useEffect(() => {
    if (user) {
      fetchAvatar();
    }
  }, [user]);

  const fetchAvatar = async () => {
    if (!user?.id) return;
    
    setIsLoadingAvatar(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching avatar:', error);
      } else if (data?.avatar_url) {
        // Отримуємо URL аватару зі сховища
        const { data: storageData } = await supabase.storage
          .from('avatars')
          .getPublicUrl(`${user.id}/${data.avatar_url}`);
          
        setAvatarUrl(storageData.publicUrl);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Перевірка типу файлу (тільки зображення)
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Помилка",
        description: "Будь ласка, виберіть файл зображення (jpg, png, webp, gif)",
        variant: "destructive",
      });
      return;
    }

    // Перевірка розміру файлу (макс. 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({
        title: "Помилка",
        description: "Розмір файлу не повинен перевищувати 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Створюємо унікальне ім'я файлу
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Завантажуємо файл у сховище
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Оновлюємо посилання на аватар у профілі користувача
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: fileName })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Оновлюємо аватар на сторінці
      await fetchAvatar();
      
      toast({
        title: "Успішно",
        description: "Ваш аватар було оновлено",
      });
      
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити аватар",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const avatarFallback = user?.username 
    ? user.username.charAt(0).toUpperCase() 
    : 'К';

  return (
    <div className="relative">
      <Avatar className={sizeClasses[size]}>
        {isLoadingAvatar ? (
          <AvatarFallback>
            <Loader2 className="h-4 w-4 animate-spin" />
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src={avatarUrl || ''} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </>
        )}
      </Avatar>

      {showStatus && user && (
        <Badge 
          variant={user.is_active ? "success" : "destructive"} 
          className="absolute -bottom-1 -right-1 text-[0.6rem] px-1 py-0 min-w-5 flex items-center justify-center"
        >
          {user.is_active ? 'A' : 'N'}
        </Badge>
      )}

      {showUpload && (
        <>
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute bottom-0 right-0 rounded-full h-5 w-5 p-0 border-background shadow"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <Camera className="h-3 w-3" />
          </Button>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Оновити аватар</DialogTitle>
                <DialogDescription>
                  Завантажте нове фото для вашого профілю
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <Avatar className="h-24 w-24">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} />
                  ) : (
                    <AvatarFallback>
                      <UserCircle className="h-16 w-16" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="grid w-full max-w-sm items-center gap-2">
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('avatar')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Завантаження...
                      </>
                    ) : (
                      'Вибрати файл'
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Підтримувані формати: JPG, PNG, WEBP, GIF. Максимальний розмір: 2MB
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsUploadDialogOpen(false)}
                  disabled={isUploading}
                >
                  Скасувати
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default UserAvatar;
