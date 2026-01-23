-- ============================================================================
-- YESHUA GUIDE - DEVOTIONAL CONTENT SEED
-- 30-day devotional series with reflections
-- Version 1.0.0
-- ============================================================================

DO $$
DECLARE
    series_id UUID;
BEGIN
    -- Create the devotional series
    INSERT INTO devotional_series (
        title,
        description,
        theme,
        total_days,
        difficulty_level,
        is_active
    ) VALUES (
        'Walking with the Shepherd',
        'A 30-day journey exploring what it means to be led by the Good Shepherd.',
        'trust',
        30,
        'beginner',
        true
    ) RETURNING id INTO series_id;

    -- Day 1: The Lord is My Shepherd
    INSERT INTO devotional_content (
        series_id, day_number, title, scripture_reference, scripture_text,
        reflection, prayer_prompt, action_step, tags, estimated_reading_minutes
    ) VALUES (
        series_id, 1,
        'The Lord is My Shepherd',
        'Psalm 23:1',
        'The LORD is my shepherd; I shall not want.',
        'These six words contain an entire theology of relationship. David says "my shepherd"—personal, intimate, a claim of belonging. The shepherd''s entire life was bound up with his flock. When you say "The LORD is my shepherd," you''re claiming the God who spoke galaxies into existence has personally committed to your care. "I shall not want" follows naturally—not that you''ll get everything desired, but you''ll lack nothing essential.',
        'Lord, I often live as my own shepherd. Today I acknowledge You as my shepherd. Teach me to trust that You know my needs better than I do.',
        'Write "The LORD is my shepherd" where you''ll see it. Each time, say it aloud as a personal declaration.',
        ARRAY['trust', 'psalm-23', 'provision'],
        4
    );

    -- Day 2: Green Pastures
    INSERT INTO devotional_content (
        series_id, day_number, title, scripture_reference, scripture_text,
        reflection, prayer_prompt, action_step, tags, estimated_reading_minutes
    ) VALUES (
        series_id, 2,
        'Green Pastures',
        'Psalm 23:2a',
        'He makes me lie down in green pastures.',
        'Notice "makes." Sheep only rest when free from fear, friction, parasites, and hunger. God creates conditions where rest becomes possible. In rocky Israel, green pastures were rare and valuable. Sometimes God "makes" us lie down because we wouldn''t do it willingly. What if that delay, that closed door, is actually your Shepherd leading you to green pastures?',
        'Father, I confess my resistance to rest. I equate busyness with value. Show me the green pastures You''ve prepared.',
        'Schedule 15 minutes of deliberate rest—no phone, no tasks. Simply be present with God.',
        ARRAY['rest', 'psalm-23', 'peace'],
        4
    );

    -- Day 3: Still Waters
    INSERT INTO devotional_content (
        series_id, day_number, title, scripture_reference, scripture_text,
        reflection, prayer_prompt, action_step, tags, estimated_reading_minutes
    ) VALUES (
        series_id, 3,
        'Still Waters',
        'Psalm 23:2b',
        'He leads me beside still waters.',
        'Sheep won''t drink from rushing streams—their wool would pull them under. A shepherd finds quiet pools. "Still waters" in Hebrew means "waters of rest." Think about how you''ve been drinking lately. Gulping anxiety from rushing streams of news and social media? Jesus said, "If anyone thirsts, let him come to me and drink." He is the still water.',
        'Lord Jesus, I am thirsty for peace, for meaning. Lead me from rushing streams that never satisfy. Be my still water.',
        'Identify one "rushing stream"—a source of agitation you keep returning to. Consider stepping away this week.',
        ARRAY['peace', 'psalm-23', 'rest'],
        4
    );

    -- Day 4: Soul Restoration
    INSERT INTO devotional_content (
        series_id, day_number, title, scripture_reference, scripture_text,
        reflection, prayer_prompt, action_step, tags, estimated_reading_minutes
    ) VALUES (
        series_id, 4,
        'Soul Restoration',
        'Psalm 23:3a',
        'He restores my soul.',
        '"Restore" means to turn back, recover. Sheep get "cast"—flipped on their backs, unable to right themselves, in mortal danger. We get cast too: depression, burnout, sin grown too heavy. The Shepherd specializes in finding cast sheep. He reaches down, grasps our wool, gently turns us right side up. Where do you need restoration? Stop struggling. Let the Shepherd do what only He can.',
        'Shepherd of my soul, I am cast down. I stop struggling and let You restore me. Your gentle hands know exactly what I need.',
        'Honest inventory: Where is your soul depleted? Name it as an invitation for the Shepherd''s restoration.',
        ARRAY['restoration', 'psalm-23', 'healing'],
        4
    );

    -- Day 5: Paths of Righteousness
    INSERT INTO devotional_content (
        series_id, day_number, title, scripture_reference, scripture_text,
        reflection, prayer_prompt, action_step, tags, estimated_reading_minutes
    ) VALUES (
        series_id, 5,
        'Paths of Righteousness',
        'Psalm 23:3b',
        'He leads me in paths of righteousness for his name''s sake.',
        '"Paths of righteousness" are right paths—safe routes free from predators and poison. Why does He lead us well? "For his name''s sake." God''s motivation is bound up with His glory. Your flourishing is a testimony to His character. But right paths aren''t always easy paths. The shepherd knows a longer route over a ridge is safer than a shorter one through a ravine.',
        'Lord, I want Your paths—not just for my benefit, but because Your name is at stake. Give me courage to follow when the right path looks harder.',
        'Where have you been taking shortcuts? What would trusting the Shepherd''s route look like?',
        ARRAY['guidance', 'psalm-23', 'righteousness'],
        4
    );

    -- Day 6: The Valley
    INSERT INTO devotional_content (
        series_id, day_number, title, scripture_reference, scripture_text,
        reflection, prayer_prompt, action_step, tags, estimated_reading_minutes
    ) VALUES (
        series_id, 6,
        'The Valley',
        'Psalm 23:4a',
        'Even though I walk through the valley of the shadow of death, I will fear no evil.',
        'The psalm shifts. From peaceful pastures to a dark valley. But even here, we''re being led. The valley isn''t a detour—it''s part of the journey. Three observations: It''s "shadow" of death—shadows can''t harm you. We walk "through" not into a dead end. And the comfort isn''t absence of the valley but presence of the Shepherd within it.',
        'Father, I''m in a valley. The shadows feel real. I believe You''re still leading, this is "through" not "to," and Your presence changes everything.',
        'If in a valley, write down when you entered. Below it write: "Walking THROUGH." Declare there is another side.',
        ARRAY['suffering', 'psalm-23', 'courage'],
        4
    );

    -- Day 7: You Are With Me
    INSERT INTO devotional_content (
        series_id, day_number, title, scripture_reference, scripture_text,
        reflection, prayer_prompt, action_step, tags, estimated_reading_minutes
    ) VALUES (
        series_id, 7,
        'You Are With Me',
        'Psalm 23:4b',
        'for you are with me; your rod and your staff, they comfort me.',
        'Notice the shift. Until now, "He makes me," "He leads me." But in the darkest valley, the language becomes intimate: "You are with me." When everything is going well, we maintain distance. In the valley, pretense falls away. We stop talking about God and start talking to Him. The rod and staff weren''t gentle—club for predators, crook for pulling sheep from danger. But they proved the shepherd was present.',
        'Lord, I stop talking about You and talk to You. You are here. Even when Your correction seems harsh, it''s proof You''re present.',
        'Recall when God''s "rod and staff" felt uncomfortable but proved to be loving care. Thank Him specifically.',
        ARRAY['presence', 'psalm-23', 'comfort'],
        4
    );

    RAISE NOTICE 'Devotional content seed completed';
END $$;

-- ============================================================================
-- STANDALONE DEVOTIONALS BY TOPIC
-- ============================================================================

INSERT INTO devotional_content (
    series_id, day_number, title, scripture_reference, scripture_text,
    reflection, prayer_prompt, action_step, tags, estimated_reading_minutes
) VALUES 
(
    NULL, NULL,
    'The Antidote to Anxiety',
    'Philippians 4:6-7',
    'Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.',
    'Paul''s prescription isn''t "stop feeling anxious"—that''s like telling someone with a fever to stop being sick. He redirects anxious energy into action: prayer with thanksgiving. The promise isn''t changed circumstances but guarding peace. "Guard" is military language—a garrison protecting a city. This peace "surpasses understanding"—you can''t think your way to it. It comes as a gift when we practice Paul''s rhythm.',
    'Lord, I come with my anxiety—not to analyze it, but to exchange it. Here are my specific requests. And here is my thanksgiving. I receive Your guarding peace.',
    'When anxiety rises: (1) acknowledge it to God, (2) make your specific request, (3) name one thing you''re thankful for. Notice what happens.',
    ARRAY['anxiety', 'peace', 'prayer'],
    4
),
(
    NULL, NULL,
    'The Nearness of God in Grief',
    'Psalm 34:18',
    'The LORD is near to the brokenhearted and saves those who are crushed in spirit.',
    'Grief isolates. Even surrounded by people, the grieving person feels alone. Into this isolation, the psalm speaks: the Lord is near. Not far off, not repulsed by our messiness—near. "Crushed" suggests pulverized, ground to powder. And it''s precisely there that salvation appears. This doesn''t mean grief disappears. Salvation often looks like one more breath, one more hour somehow endured.',
    'Lord, my heart is broken. I don''t ask You to explain or fix or rush me through this. I only ask You to be near. Press close. Save what is crushed in me.',
    'Resist stuffing or rushing grief. Give yourself permission for honest mourning—tears, journaling, silence. Let God be near in it.',
    ARRAY['grief', 'loss', 'comfort'],
    4
),
(
    NULL, NULL,
    'When Fear Speaks First',
    'Psalm 56:3',
    'When I am afraid, I put my trust in you.',
    'David doesn''t say "I never feel afraid." He acknowledges a sequence: fear comes, then trust is chosen. The feeling arrives unbidden; the response is deliberate. Fear is biological, hardwired for survival. The question isn''t whether you feel fear but what you do with it. "I put my trust in you"—not in my ability to feel confident, not in outcomes, but in You. We don''t need to feel brave; we need to know the One we''re trusting is trustworthy.',
    'God, I am afraid. I don''t pretend otherwise. But I choose to put my trust in You—not in feelings, not in outcomes, but in Your character.',
    'Memorize Psalm 56:3. When fear appears, say it aloud. Notice how speaking truth changes the inner atmosphere.',
    ARRAY['fear', 'courage', 'trust'],
    4
),
(
    NULL, NULL,
    'The Weight We Were Never Meant to Carry',
    'Ephesians 4:31-32',
    'Let all bitterness and wrath and anger and clamor and slander be put away from you, along with all malice. Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you.',
    'Paul lists a progression: bitterness festers into wrath, which hardens into anger, erupts in clamor, degrades into slander, hardens into malice. Unforgiveness is cancer with predictable metastasis. "Put away" suggests removing a garment that doesn''t fit who we are in Christ. We forgive from overflow of having been forgiven. The offenses against us, however real, are shadowed by what we committed against a holy God—which He absorbed in Christ.',
    'Father, I''ve been wearing heavy garments of bitterness. Today I take them off. Not because they deserve forgiveness, but because I''ve been forgiven far more.',
    'Is there someone to forgive? Write their name, then write across it: "As God in Christ forgave me."',
    ARRAY['forgiveness', 'anger', 'freedom'],
    4
);
