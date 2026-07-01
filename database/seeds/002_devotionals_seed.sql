-- =============================================================================
-- 002_devotionals_seed.sql — Psalm 23 devotionals loaded into public.devotionals
-- (remapped from the retired devotional_content/series model to match the API).
-- scheduled_date is anchored to the day you run this, so the series rotates daily
-- for its length via the route's tier-1 (scheduled_date = today) selection.
-- Idempotent + re-schedulable via ON CONFLICT (title).
-- Run AFTER migration 002_devotionals_columns.sql.
-- =============================================================================

INSERT INTO public.devotionals
  (day_of_year, scheduled_date, is_active, title, scripture_reference, scripture_text,
   reflection, prayer_prompt, action_step, tags, estimated_reading_minutes)
VALUES (
    1, current_date + 0, true,
        'The Lord is My Shepherd',
        'Psalm 23:1',
        'The LORD is my shepherd; I shall not want.',
        'These six words contain an entire theology of relationship. David says "my shepherd"—personal, intimate, a claim of belonging. The shepherd''s entire life was bound up with his flock. When you say "The LORD is my shepherd," you''re claiming the God who spoke galaxies into existence has personally committed to your care. "I shall not want" follows naturally—not that you''ll get everything desired, but you''ll lack nothing essential.',
        'Lord, I often live as my own shepherd. Today I acknowledge You as my shepherd. Teach me to trust that You know my needs better than I do.',
        'Write "The LORD is my shepherd" where you''ll see it. Each time, say it aloud as a personal declaration.',
        ARRAY['trust', 'psalm-23', 'provision'],
        4
)
ON CONFLICT (title) DO UPDATE SET
  scheduled_date = EXCLUDED.scheduled_date, is_active = true;

INSERT INTO public.devotionals
  (day_of_year, scheduled_date, is_active, title, scripture_reference, scripture_text,
   reflection, prayer_prompt, action_step, tags, estimated_reading_minutes)
VALUES (
    2, current_date + 1, true,
        'Green Pastures',
        'Psalm 23:2a',
        'He makes me lie down in green pastures.',
        'Notice "makes." Sheep only rest when free from fear, friction, parasites, and hunger. God creates conditions where rest becomes possible. In rocky Israel, green pastures were rare and valuable. Sometimes God "makes" us lie down because we wouldn''t do it willingly. What if that delay, that closed door, is actually your Shepherd leading you to green pastures?',
        'Father, I confess my resistance to rest. I equate busyness with value. Show me the green pastures You''ve prepared.',
        'Schedule 15 minutes of deliberate rest—no phone, no tasks. Simply be present with God.',
        ARRAY['rest', 'psalm-23', 'peace'],
        4
)
ON CONFLICT (title) DO UPDATE SET
  scheduled_date = EXCLUDED.scheduled_date, is_active = true;

INSERT INTO public.devotionals
  (day_of_year, scheduled_date, is_active, title, scripture_reference, scripture_text,
   reflection, prayer_prompt, action_step, tags, estimated_reading_minutes)
VALUES (
    3, current_date + 2, true,
        'Still Waters',
        'Psalm 23:2b',
        'He leads me beside still waters.',
        'Sheep won''t drink from rushing streams—their wool would pull them under. A shepherd finds quiet pools. "Still waters" in Hebrew means "waters of rest." Think about how you''ve been drinking lately. Gulping anxiety from rushing streams of news and social media? Jesus said, "If anyone thirsts, let him come to me and drink." He is the still water.',
        'Lord Jesus, I am thirsty for peace, for meaning. Lead me from rushing streams that never satisfy. Be my still water.',
        'Identify one "rushing stream"—a source of agitation you keep returning to. Consider stepping away this week.',
        ARRAY['peace', 'psalm-23', 'rest'],
        4
)
ON CONFLICT (title) DO UPDATE SET
  scheduled_date = EXCLUDED.scheduled_date, is_active = true;

INSERT INTO public.devotionals
  (day_of_year, scheduled_date, is_active, title, scripture_reference, scripture_text,
   reflection, prayer_prompt, action_step, tags, estimated_reading_minutes)
VALUES (
    4, current_date + 3, true,
        'Soul Restoration',
        'Psalm 23:3a',
        'He restores my soul.',
        '"Restore" means to turn back, recover. Sheep get "cast"—flipped on their backs, unable to right themselves, in mortal danger. We get cast too: depression, burnout, sin grown too heavy. The Shepherd specializes in finding cast sheep. He reaches down, grasps our wool, gently turns us right side up. Where do you need restoration? Stop struggling. Let the Shepherd do what only He can.',
        'Shepherd of my soul, I am cast down. I stop struggling and let You restore me. Your gentle hands know exactly what I need.',
        'Honest inventory: Where is your soul depleted? Name it as an invitation for the Shepherd''s restoration.',
        ARRAY['restoration', 'psalm-23', 'healing'],
        4
)
ON CONFLICT (title) DO UPDATE SET
  scheduled_date = EXCLUDED.scheduled_date, is_active = true;

INSERT INTO public.devotionals
  (day_of_year, scheduled_date, is_active, title, scripture_reference, scripture_text,
   reflection, prayer_prompt, action_step, tags, estimated_reading_minutes)
VALUES (
    5, current_date + 4, true,
        'Paths of Righteousness',
        'Psalm 23:3b',
        'He leads me in paths of righteousness for his name''s sake.',
        '"Paths of righteousness" are right paths—safe routes free from predators and poison. Why does He lead us well? "For his name''s sake." God''s motivation is bound up with His glory. Your flourishing is a testimony to His character. But right paths aren''t always easy paths. The shepherd knows a longer route over a ridge is safer than a shorter one through a ravine.',
        'Lord, I want Your paths—not just for my benefit, but because Your name is at stake. Give me courage to follow when the right path looks harder.',
        'Where have you been taking shortcuts? What would trusting the Shepherd''s route look like?',
        ARRAY['guidance', 'psalm-23', 'righteousness'],
        4
)
ON CONFLICT (title) DO UPDATE SET
  scheduled_date = EXCLUDED.scheduled_date, is_active = true;

INSERT INTO public.devotionals
  (day_of_year, scheduled_date, is_active, title, scripture_reference, scripture_text,
   reflection, prayer_prompt, action_step, tags, estimated_reading_minutes)
VALUES (
    6, current_date + 5, true,
        'The Valley',
        'Psalm 23:4a',
        'Even though I walk through the valley of the shadow of death, I will fear no evil.',
        'The psalm shifts. From peaceful pastures to a dark valley. But even here, we''re being led. The valley isn''t a detour—it''s part of the journey. Three observations: It''s "shadow" of death—shadows can''t harm you. We walk "through" not into a dead end. And the comfort isn''t absence of the valley but presence of the Shepherd within it.',
        'Father, I''m in a valley. The shadows feel real. I believe You''re still leading, this is "through" not "to," and Your presence changes everything.',
        'If in a valley, write down when you entered. Below it write: "Walking THROUGH." Declare there is another side.',
        ARRAY['suffering', 'psalm-23', 'courage'],
        4
)
ON CONFLICT (title) DO UPDATE SET
  scheduled_date = EXCLUDED.scheduled_date, is_active = true;

INSERT INTO public.devotionals
  (day_of_year, scheduled_date, is_active, title, scripture_reference, scripture_text,
   reflection, prayer_prompt, action_step, tags, estimated_reading_minutes)
VALUES (
    7, current_date + 6, true,
        'You Are With Me',
        'Psalm 23:4b',
        'for you are with me; your rod and your staff, they comfort me.',
        'Notice the shift. Until now, "He makes me," "He leads me." But in the darkest valley, the language becomes intimate: "You are with me." When everything is going well, we maintain distance. In the valley, pretense falls away. We stop talking about God and start talking to Him. The rod and staff weren''t gentle—club for predators, crook for pulling sheep from danger. But they proved the shepherd was present.',
        'Lord, I stop talking about You and talk to You. You are here. Even when Your correction seems harsh, it''s proof You''re present.',
        'Recall when God''s "rod and staff" felt uncomfortable but proved to be loving care. Thank Him specifically.',
        ARRAY['presence', 'psalm-23', 'comfort'],
        4
)
ON CONFLICT (title) DO UPDATE SET
  scheduled_date = EXCLUDED.scheduled_date, is_active = true;

