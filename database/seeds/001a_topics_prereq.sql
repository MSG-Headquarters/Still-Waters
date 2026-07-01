-- 001a_topics_prereq.sql
-- Fixes two bugs that stop 001 from seeding on a fresh DB:
--  (1) adds the UNIQUE(name) constraint 001's ON CONFLICT (name) requires
--  (2) pre-seeds all 19 topics so 001's SELECT..INTO resolves (it only creates Hope inline)
-- Run AFTER 000 (books) and BEFORE 001 (scriptures). Idempotent.

CREATE UNIQUE INDEX IF NOT EXISTS scripture_topics_name_uidx ON public.scripture_topics(name);

INSERT INTO public.scripture_topics (name, category, description) VALUES
  ('Anxiety','emotion','Scriptures for worry, anxiety, and finding calm in God'),
  ('Grief','emotion','Comfort in loss, mourning, and sorrow'),
  ('Joy','emotion','Delight, rejoicing, and gladness in the Lord'),
  ('Anger','emotion','Handling anger, patience, and self-control'),
  ('Loneliness','emotion','God''s presence in isolation and solitude'),
  ('Fear','emotion','Courage, and trusting God over fear'),
  ('Depression','emotion','Hope and help in darkness and despair'),
  ('Peace','spiritual','The peace of God that guards heart and mind'),
  ('Gratitude','spiritual','Thanksgiving and a grateful heart'),
  ('Forgiveness','spiritual','Receiving and extending forgiveness'),
  ('Faith','spiritual','Trust, belief, and walking with God'),
  ('Prayer','spiritual','Communion with God through prayer'),
  ('Purpose','life','Calling, meaning, and God''s plan'),
  ('Identity','life','Who we are in Christ'),
  ('Wisdom','spiritual','Discernment and godly understanding'),
  ('Hope','emotion','Scriptures about hope, expectation, and future promises'),
  ('Love of God','spiritual','God''s steadfast love and our love for Him'),
  ('Salvation','doctrine','Redemption, grace, and eternal life'),
  ('Grace','doctrine','God''s unmerited favor and mercy')
ON CONFLICT (name) DO NOTHING;
