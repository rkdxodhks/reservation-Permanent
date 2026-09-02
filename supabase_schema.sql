-- ========================================================
-- 스마트 부스 예약 시스템 2.0 (Reservation Timetable 2.0)
-- Supabase 데이터베이스 구축 DDL 스크립트
-- ========================================================

-- 1. 행사 기본 설정 테이블 (app_settings)
CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  event_title VARCHAR(200) NOT NULL DEFAULT '연구실 체험부스 실시간 예약 시스템',
  event_dates JSONB NOT NULL DEFAULT '["2026-09-10", "2026-09-11"]'::jsonb,
  max_reservations_per_student INT NOT NULL DEFAULT 2,
  max_capacity_per_slot INT NOT NULL DEFAULT 2,
  start_time VARCHAR(10) NOT NULL DEFAULT '10:00',
  end_time VARCHAR(10) NOT NULL DEFAULT '16:00',
  slot_interval INT NOT NULL DEFAULT 20,
  admin_passcode VARCHAR(100) NOT NULL DEFAULT 'admin1234',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 초기 기본 설정 행 삽입
INSERT INTO app_settings (id, event_title, event_dates, max_reservations_per_student, max_capacity_per_slot, start_time, end_time, slot_interval, admin_passcode)
VALUES (
  1,
  '연구실 체험부스 실시간 예약 시스템',
  '["2026-09-10", "2026-09-11"]'::jsonb,
  2,
  2,
  '10:00',
  '16:00',
  20,
  'admin1234'
) ON CONFLICT (id) DO NOTHING;


-- 2. 부스/실험실 목록 테이블 (booths)
CREATE TABLE IF NOT EXISTS booths (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  color_tag VARCHAR(20) DEFAULT '#3b82f6',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 부스 항목 삽입
INSERT INTO booths (name, description, color_tag, display_order)
VALUES 
  ('전임상의약실험실', '의약품 임상 및 전임상 관련 연구 체험', '#3b82f6', 1),
  ('생체소재 및 대사질환실험실', '생체재료 및 대사 질환 모델 탐구', '#10b981', 2),
  ('고분자약물전달실험실', '약물 전달 체계 및 나노 입자 관찰', '#8b5cf6', 3),
  ('고분자콜로이드실험실', '콜로이드 화학 및 계면 현상 체험', '#f59e0b', 4),
  ('나노인공세포공학실험실', '인공 세포 및 나노 기술 응용 실험', '#ec4899', 5),
  ('바이오의약소재실험실', '바이오 의약품 소재 및 분석실험', '#06b6d4', 6)
ON CONFLICT DO NOTHING;


-- 3. 예약 테이블 (reservations)
CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  student_name VARCHAR(50) NOT NULL,
  auth_number VARCHAR(20) NOT NULL,
  booth_id VARCHAR(100) NOT NULL, -- 부스 명칭 또는 ID
  date VARCHAR(20) NOT NULL,       -- YYYY-MM-DD
  time_slot VARCHAR(20) NOT NULL,  -- HH:MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 4. 개별 슬롯 차단/블록 테이블 (slot_blocks)
CREATE TABLE IF NOT EXISTS slot_blocks (
  id SERIAL PRIMARY KEY,
  booth_id VARCHAR(100) NOT NULL,
  date VARCHAR(20) NOT NULL,
  time_slot VARCHAR(20) NOT NULL,
  reason VARCHAR(200) DEFAULT '예약 불가',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_block UNIQUE (booth_id, date, time_slot)
);


-- 5. Row Level Security (RLS) 정책 설정
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_blocks ENABLE ROW LEVEL SECURITY;

-- 읽기 및 쓰기 허용 정책 (모든 사용자 오픈 access)
DROP POLICY IF EXISTS "Allow full access for app_settings" ON app_settings;
CREATE POLICY "Allow full access for app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for booths" ON booths;
CREATE POLICY "Allow full access for booths" ON booths FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for reservations" ON reservations;
CREATE POLICY "Allow full access for reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for slot_blocks" ON slot_blocks;
CREATE POLICY "Allow full access for slot_blocks" ON slot_blocks FOR ALL USING (true) WITH CHECK (true);


-- 6. Supabase Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE booths;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE slot_blocks;
