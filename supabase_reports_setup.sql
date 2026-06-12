-- ============================================
-- MugalimPipe - Supabase Database Setup
-- ============================================
-- Этот скрипт создает все необходимые таблицы,
-- индексы и политики безопасности для работы с AI отчетами
-- ============================================

-- ============================================
-- 1. Создаем таблицу reports (отчеты)
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Основная информация
  title TEXT NOT NULL DEFAULT 'Анализ урока',
  description TEXT,

  -- Результаты анализа
  total_score INTEGER DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 1000),
  percentage NUMERIC DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  grade TEXT DEFAULT 'N/A',

  -- Детальные метрики (JSON)
  metrics JSONB DEFAULT '{}',

  -- AI отчет (JSON)
  ai_report JSONB DEFAULT '{}',

  -- Сильные стороны и зоны роста
  strengths TEXT[] DEFAULT '{}',
  priority_areas TEXT[] DEFAULT '{}',

  -- Файл отчета (PDF)
  file_name TEXT,
  file_url TEXT,
  storage_path TEXT,
  file_size BIGINT,

  -- Метаданные
  video_duration NUMERIC,
  video_file_name TEXT,
  transcription TEXT,

  -- Временные метки
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Статус
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- ============================================
-- 2. Создаем индексы для производительности
-- ============================================

-- Индекс по пользователю
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- Индекс по дате создания (для сортировки)
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Комбинированный индекс (пользователь + дата)
CREATE INDEX IF NOT EXISTS idx_reports_user_created ON reports(user_id, created_at DESC);

-- Индекс по статусу
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Индекс для JSONB полей (поиск по метрикам)
CREATE INDEX IF NOT EXISTS idx_reports_metrics ON reports USING GIN (metrics);

-- Индекс для JSONB AI отчета
CREATE INDEX IF NOT EXISTS idx_reports_ai_report ON reports USING GIN (ai_report);

-- ============================================
-- 3. Включаем Row Level Security (RLS)
-- ============================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Создаем политики безопасности (Policies)
-- ============================================

-- Пользователи могут просматривать ТОЛЬКО свои отчеты
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
CREATE POLICY "Users can view own reports"
  ON reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. Создаем таблицу user_statistics (статистика пользователей)
-- ============================================
CREATE TABLE IF NOT EXISTS user_statistics (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Счетчики
  total_analyses INTEGER DEFAULT 0,
  completed_analyses INTEGER DEFAULT 0,
  
  -- Средние показатели
  average_score NUMERIC DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  worst_score INTEGER DEFAULT 0,
  
  -- Последний анализ
  last_analysis_date TIMESTAMPTZ,
  last_analysis_score INTEGER,
  
  -- Достижения
  achievements JSONB DEFAULT '[]',
  
  -- Временные метки
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс по среднему баллу (для лидерборда)
CREATE INDEX IF NOT EXISTS idx_user_stats_avg_score ON user_statistics(average_score DESC);

-- RLS для статистики
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- Пользователи видят ТОЛЬКО свою статистику
DROP POLICY IF EXISTS "Users can view own statistics" ON user_statistics;
CREATE POLICY "Users can view own statistics"
  ON user_statistics FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 6. Создаем функцию для обновления updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Создаем триггеры для автообновления updated_at
-- ============================================

-- Триггер для reports
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Триггер для user_statistics
DROP TRIGGER IF EXISTS update_user_statistics_updated_at ON user_statistics;
CREATE TRIGGER update_user_statistics_updated_at
  BEFORE UPDATE ON user_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Создаем функцию для обновления статистики пользователя
-- ============================================
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновляем статистику после создания отчета
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_statistics (user_id, total_analyses, completed_analyses, last_analysis_date, last_analysis_score)
    VALUES (
      NEW.user_id,
      1,
      CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
      NEW.created_at,
      NEW.total_score
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_analyses = user_statistics.total_analyses + 1,
      completed_analyses = user_statistics.completed_analyses + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
      last_analysis_date = NEW.created_at,
      last_analysis_score = NEW.total_score,
      average_score = (
        SELECT AVG(total_score) FROM reports 
        WHERE user_id = NEW.user_id AND status = 'completed'
      ),
      best_score = GREATEST(user_statistics.best_score, NEW.total_score),
      worst_score = LEAST(user_statistics.worst_score, NEW.total_score),
      updated_at = NOW();
  END IF;
  
  -- Обновляем статистику после удаления отчета
  IF TG_OP = 'DELETE' THEN
    UPDATE user_statistics SET
      total_analyses = GREATEST(0, total_analyses - 1),
      completed_analyses = GREATEST(0, completed_analyses - CASE WHEN OLD.status = 'completed' THEN 1 ELSE 0 END),
      average_score = (
        SELECT COALESCE(AVG(total_score), 0) FROM reports 
        WHERE user_id = OLD.user_id AND status = 'completed'
      ),
      updated_at = NOW()
    WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Создаем триггер для автообновления статистики
-- ============================================
DROP TRIGGER IF EXISTS update_stats_on_report_change ON reports;
CREATE TRIGGER update_stats_on_report_change
  AFTER INSERT OR DELETE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_user_statistics();

-- ============================================
-- 10. Создаем Storage Bucket для PDF файлов
-- ============================================
-- Примечание: Storage bucket нужно создать вручную через Dashboard
-- Или выполнить этот SQL в Supabase Dashboard > Storage

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'reports',
--   'reports',
--   false,  -- Private bucket
--   10485760,  -- 10 MB limit
--   ARRAY['application/pdf']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 11. Создаем политики для Storage
-- ============================================
-- Эти политики будут применены после создания bucket

-- INSERT INTO storage.policies (bucket_id, name, action, expression)
-- VALUES
--   ('reports', 'Users can upload their own reports', 'INSERT', 
--    'bucket_id = ''reports'' AND auth.uid()::text = (storage.foldername(name))[1]'),
--   ('reports', 'Users can view their own reports', 'SELECT', 
--    'bucket_id = ''reports'' AND auth.uid()::text = (storage.foldername(name))[1]'),
--   ('reports', 'Users can delete their own reports', 'DELETE', 
--    'bucket_id = ''reports'' AND auth.uid()::text = (storage.foldername(name))[1]')
-- ON CONFLICT (bucket_id, name) DO NOTHING;

-- ============================================
-- 12. Создаем VIEW для дашборда пользователя
-- ============================================
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
  u.id as user_id,
  u.email,
  COALESCE(s.total_analyses, 0) as total_analyses,
  COALESCE(s.average_score, 0) as average_score,
  COALESCE(s.best_score, 0) as best_score,
  s.last_analysis_date,
  s.last_analysis_score,
  -- Последние 5 отчетов
  (
    SELECT json_agg(r ORDER BY r.created_at DESC LIMIT 5)
    FROM reports r
    WHERE r.user_id = u.id AND r.status = 'completed'
  ) as recent_reports
FROM auth.users u
LEFT JOIN user_statistics s ON u.id = s.user_id;

-- RLS для VIEW (наследуется от базовых таблиц)

-- ============================================
-- 13. Создаем функцию для получения статистики по пользователю
-- ============================================
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  user_id UUID,
  total_analyses INTEGER,
  completed_analyses INTEGER,
  average_score NUMERIC,
  best_score INTEGER,
  worst_score INTEGER,
  last_analysis_date TIMESTAMPTZ,
  achievements JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.user_id,
    us.total_analyses,
    us.completed_analyses,
    us.average_score,
    us.best_score,
    us.worst_score,
    us.last_analysis_date,
    us.achievements
  FROM user_statistics us
  WHERE us.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 14. Создаем функцию для получения отчетов пользователя
-- ============================================
CREATE OR REPLACE FUNCTION get_user_reports(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_status TEXT DEFAULT 'completed'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  total_score INTEGER,
  percentage NUMERIC,
  grade TEXT,
  created_at TIMESTAMPTZ,
  file_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.total_score,
    r.percentage,
    r.grade,
    r.created_at,
    r.file_url
  FROM reports r
  WHERE r.user_id = auth.uid()
    AND (p_status = 'all' OR r.status = p_status)
  ORDER BY r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Setup complete! ✅
-- ============================================
-- 
-- Следующие шаги:
-- 1. Выполните этот скрипт в Supabase SQL Editor
-- 2. Создайте Storage bucket 'reports' вручную:
--    - Dashboard > Storage > Create bucket
--    - Name: reports
--    - Public: false
--    - File size limit: 10485760 (10 MB)
-- 3. Проверьте что таблицы созданы:
--    SELECT * FROM reports LIMIT 1;
--    SELECT * FROM user_statistics LIMIT 1;
-- ============================================
