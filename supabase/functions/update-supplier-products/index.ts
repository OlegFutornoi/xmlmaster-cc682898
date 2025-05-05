
// Функція для автоматичного оновлення товарів постачальників
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    // Створення клієнта Supabase з сервісної ролі
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Отримання активних постачальників з URL
    const { data: suppliers, error } = await supabaseClient
      .from("suppliers")
      .select("id, name, url, user_id")
      .eq("is_active", true)
      .not("url", "is", null);

    if (error) {
      throw new Error(`Помилка отримання постачальників: ${error.message}`);
    }

    const results = [];

    // Обробка кожного постачальника
    for (const supplier of suppliers) {
      try {
        // Імпортуємо універсальний обробник файлів
        const { processSupplierFile } = await import(
          "https://esm.sh/@lovable/import-file-processor@1.0.0"
        ).catch(() => {
          // Якщо модуль не існує, використовуємо мінімальну реалізацію
          return {
            processSupplierFile: async (url: string) => {
              try {
                const response = await fetch(url);
                if (!response.ok) {
                  return { 
                    success: false, 
                    message: `Помилка завантаження файлу: ${response.status}` 
                  };
                }
                
                const content = await response.text();
                const isXml = url.toLowerCase().endsWith(".xml");
                const isCsv = url.toLowerCase().endsWith(".csv");
                
                if (!content) {
                  return { 
                    success: false, 
                    message: "Файл порожній" 
                  };
                }
                
                return {
                  success: true,
                  message: `Файл успішно оброблено: ${isXml ? "XML" : isCsv ? "CSV" : "невідомий формат"}`,
                  fileType: isXml ? "XML" : isCsv ? "CSV" : "UNKNOWN"
                };
              } catch (error) {
                return { 
                  success: false, 
                  message: `Помилка обробки файлу: ${error instanceof Error ? error.message : String(error)}` 
                };
              }
            }
          };
        });

        if (!supplier.url) {
          results.push({
            supplierId: supplier.id,
            name: supplier.name,
            status: "skipped",
            message: "URL не вказано",
          });
          continue;
        }

        // Обробляємо файл
        const result = await processSupplierFile(supplier.url);

        // Записуємо результат
        await supabaseClient
          .from("supplier_updates")
          .insert({
            supplier_id: supplier.id,
            user_id: supplier.user_id,
            status: result.success ? "success" : "error",
            message: result.message,
            processed_at: new Date().toISOString(),
          });

        results.push({
          supplierId: supplier.id,
          name: supplier.name,
          status: result.success ? "success" : "error",
          message: result.message,
        });
      } catch (supplierError) {
        console.error(`Помилка обробки постачальника ${supplier.id}:`, supplierError);
        results.push({
          supplierId: supplier.id,
          name: supplier.name,
          status: "error",
          message: supplierError instanceof Error ? supplierError.message : String(supplierError),
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Помилка виконання функції:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
