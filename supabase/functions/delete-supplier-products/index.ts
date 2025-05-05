
// Edge функція для видалення даних постачальника
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS заголовки
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Обробка OPTIONS запитів (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Отримуємо Supabase клієнт з API ключем з запиту
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Не вказано токен авторизації"
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Отримуємо дані запиту
    const { supplierId } = await req.json();
    
    if (!supplierId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "ID постачальника не вказано",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Створюємо Supabase клієнт
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { 
          headers: { Authorization: authHeader } 
        }
      }
    );

    // Викликаємо функцію для видалення даних постачальника
    const { error } = await supabaseClient.rpc('delete_supplier_data', {
      supplier_id_param: supplierId
    });

    if (error) {
      console.error("Помилка видалення даних:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Помилка видалення даних: ${error.message}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Повертаємо успішний результат
    return new Response(
      JSON.stringify({
        success: true,
        message: "Дані постачальника успішно видалено",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Помилка обробки запиту:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Помилка обробки запиту: ${error instanceof Error ? error.message : String(error)}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
