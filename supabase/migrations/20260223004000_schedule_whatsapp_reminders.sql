-- Agendamento da função de lembretes via WhatsApp
-- Executa a cada 1 minuto

SELECT cron.schedule(
  'whatsapp-reminders-job', -- nome único do job
  '* * * * *',             -- cron expression (todo minuto)
  $$
  SELECT
    net.http_post(
      url := 'https://fbfzcmydjjqoyzgrkocg.supabase.co/functions/v1/whatsapp-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM pg_catalog.pg_settings WHERE name = 'app.settings.service_role_key') -- Ajuste manual pode ser necessário dependendo da config do projeto
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Nota: Certifique-se de que a função whatsapp-reminders não exige JWT se for chamada assim, 
-- ou passe o Service Role Key corretamente.
