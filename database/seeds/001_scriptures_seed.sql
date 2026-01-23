-- ============================================================================
-- YESHUA GUIDE - SCRIPTURE SEED DATA
-- Comprehensive topical scripture database
-- Version 1.0.0
-- ============================================================================

-- ============================================================================
-- SECTION 1: CORE SCRIPTURES - ANXIETY & WORRY
-- ============================================================================

-- Get topic IDs (we'll reference by name in this seed)
DO $$
DECLARE
    topic_anxiety UUID;
    topic_grief UUID;
    topic_joy UUID;
    topic_anger UUID;
    topic_loneliness UUID;
    topic_fear UUID;
    topic_depression UUID;
    topic_peace UUID;
    topic_gratitude UUID;
    topic_forgiveness UUID;
    topic_faith UUID;
    topic_prayer UUID;
    topic_purpose UUID;
    topic_identity UUID;
    topic_wisdom UUID;
    topic_hope UUID;
    topic_love UUID;
    topic_salvation UUID;
    topic_grace UUID;
    
    -- Scripture IDs
    scripture_id UUID;
BEGIN
    -- Get topic IDs
    SELECT id INTO topic_anxiety FROM scripture_topics WHERE name = 'Anxiety';
    SELECT id INTO topic_grief FROM scripture_topics WHERE name = 'Grief';
    SELECT id INTO topic_joy FROM scripture_topics WHERE name = 'Joy';
    SELECT id INTO topic_anger FROM scripture_topics WHERE name = 'Anger';
    SELECT id INTO topic_loneliness FROM scripture_topics WHERE name = 'Loneliness';
    SELECT id INTO topic_fear FROM scripture_topics WHERE name = 'Fear';
    SELECT id INTO topic_depression FROM scripture_topics WHERE name = 'Depression';
    SELECT id INTO topic_peace FROM scripture_topics WHERE name = 'Peace';
    SELECT id INTO topic_gratitude FROM scripture_topics WHERE name = 'Gratitude';
    SELECT id INTO topic_forgiveness FROM scripture_topics WHERE name = 'Forgiveness';
    SELECT id INTO topic_faith FROM scripture_topics WHERE name = 'Faith';
    SELECT id INTO topic_prayer FROM scripture_topics WHERE name = 'Prayer';
    SELECT id INTO topic_purpose FROM scripture_topics WHERE name = 'Purpose';
    SELECT id INTO topic_identity FROM scripture_topics WHERE name = 'Identity';
    SELECT id INTO topic_wisdom FROM scripture_topics WHERE name = 'Wisdom';
    SELECT id INTO topic_salvation FROM scripture_topics WHERE name = 'Salvation';
    SELECT id INTO topic_grace FROM scripture_topics WHERE name = 'Grace';
    
    -- Create Hope topic if not exists
    INSERT INTO scripture_topics (name, category, description)
    VALUES ('Hope', 'emotion', 'Scriptures about hope, expectation, and future promises')
    ON CONFLICT (name) DO NOTHING;
    SELECT id INTO topic_hope FROM scripture_topics WHERE name = 'Hope';
    
    -- Create Love of God topic reference
    SELECT id INTO topic_love FROM scripture_topics WHERE name = 'Love of God';

    -- ========================================================================
    -- ANXIETY & WORRY SCRIPTURES
    -- ========================================================================
    
    -- Philippians 4:6-7
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Phil'),
        4, 6, 7, 'Philippians 4:6-7',
        'Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.',
        'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
        'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
        'Be anxious for nothing, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all comprehension, will guard your hearts and your minds in Christ Jesus.',
        'Don''t worry about anything; instead, pray about everything. Tell God what you need, and thank him for all he has done. Then you will experience God''s peace, which exceeds anything we can understand. His peace will guard your hearts and minds as you live in Christ Jesus.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_anxiety, 1.00, 'Primary text on anxiety - the antidote of prayer with thanksgiving'),
        (scripture_id, topic_peace, 0.95, 'Promise of peace that guards heart and mind'),
        (scripture_id, topic_prayer, 0.85, 'Model for bringing concerns to God');

    -- Matthew 6:25-27
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Matt'),
        6, 25, 27, 'Matthew 6:25-27',
        'Therefore I tell you, do not be anxious about your life, what you will eat or what you will drink, nor about your body, what you will put on. Is not life more than food, and the body more than clothing? Look at the birds of the air: they neither sow nor reap nor gather into barns, and yet your heavenly Father feeds them. Are you not of more value than they? And which of you by being anxious can add a single hour to his span of life?',
        'Therefore I tell you, do not worry about your life, what you will eat or drink; or about your body, what you will wear. Is not life more than food, and the body more than clothes? Look at the birds of the air; they do not sow or reap or store away in barns, and yet your heavenly Father feeds them. Are you not much more valuable than they? Can any one of you by worrying add a single hour to your life?',
        'Therefore I say unto you, Take no thought for your life, what ye shall eat, or what ye shall drink; nor yet for your body, what ye shall put on. Is not the life more than meat, and the body than raiment? Behold the fowls of the air: for they sow not, neither do they reap, nor gather into barns; yet your heavenly Father feedeth them. Are ye not much better than they? Which of you by taking thought can add one cubit unto his stature?',
        'For this reason I say to you, do not be worried about your life, as to what you will eat or what you will drink; nor for your body, as to what you will put on. Is not life more than food, and the body more than clothing? Look at the birds of the air, that they do not sow, nor reap nor gather into barns, and yet your heavenly Father feeds them. Are you not worth much more than they? And who of you by being worried can add a single hour to his life?',
        'That is why I tell you not to worry about everyday life—whether you have enough food and drink, or enough clothes to wear. Isn''t life more than food, and your body more than clothing? Look at the birds. They don''t plant or harvest or store food in barns, for your heavenly Father feeds them. And aren''t you far more valuable to him than they are? Can all your worries add a single moment to your life?'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_anxiety, 1.00, 'Jesus teaching on worry - God''s provision and our value'),
        (scripture_id, topic_faith, 0.80, 'Trust in God''s care and provision');

    -- Matthew 6:33-34
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Matt'),
        6, 33, 34, 'Matthew 6:33-34',
        'But seek first the kingdom of God and his righteousness, and all these things will be added to you. Therefore do not be anxious about tomorrow, for tomorrow will be anxious for itself. Sufficient for the day is its own trouble.',
        'But seek first his kingdom and his righteousness, and all these things will be given to you as well. Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.',
        'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you. Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.',
        'But seek first His kingdom and His righteousness, and all these things will be added to you. So do not worry about tomorrow; for tomorrow will care for itself. Each day has enough trouble of its own.',
        'Seek the Kingdom of God above all else, and live righteously, and he will give you everything you need. So don''t worry about tomorrow, for tomorrow will bring its own worries. Today''s trouble is enough for today.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_anxiety, 0.95, 'Practical wisdom - one day at a time'),
        (scripture_id, topic_purpose, 0.85, 'Seeking God''s kingdom as primary focus');

    -- 1 Peter 5:7
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = '1Pet'),
        5, 7, NULL, '1 Peter 5:7',
        'casting all your anxieties on him, because he cares for you.',
        'Cast all your anxiety on him because he cares for you.',
        'Casting all your care upon him; for he careth for you.',
        'casting all your anxiety on Him, because He cares for you.',
        'Give all your worries and cares to God, for he cares about you.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_anxiety, 1.00, 'Simple, direct invitation to release anxiety'),
        (scripture_id, topic_love, 0.80, 'God''s personal care for us');

    -- Isaiah 41:10
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Isa'),
        41, 10, NULL, 'Isaiah 41:10',
        'fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.',
        'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.',
        'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.',
        'Do not fear, for I am with you; Do not anxiously look about you, for I am your God. I will strengthen you, surely I will help you, Surely I will uphold you with My righteous right hand.',
        'Don''t be afraid, for I am with you. Don''t be discouraged, for I am your God. I will strengthen you and help you. I will hold you up with my victorious right hand.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_anxiety, 0.90, 'God''s presence and strength in fearful times'),
        (scripture_id, topic_fear, 1.00, 'Primary "fear not" passage with promises');

    -- Psalm 94:19
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Ps'),
        94, 19, NULL, 'Psalm 94:19',
        'When the cares of my heart are many, your consolations cheer my soul.',
        'When anxiety was great within me, your consolation brought me joy.',
        'In the multitude of my thoughts within me thy comforts delight my soul.',
        'When my anxious thoughts multiply within me, Your consolations delight my soul.',
        'When doubts filled my mind, your comfort gave me renewed hope and cheer.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_anxiety, 0.95, 'God''s comfort in overwhelming thoughts'),
        (scripture_id, topic_hope, 0.80, 'Finding joy despite anxiety');

    -- ========================================================================
    -- GRIEF & LOSS SCRIPTURES
    -- ========================================================================

    -- Psalm 34:18
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Ps'),
        34, 18, NULL, 'Psalm 34:18',
        'The LORD is near to the brokenhearted and saves the crushed in spirit.',
        'The LORD is close to the brokenhearted and saves those who are crushed in spirit.',
        'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.',
        'The LORD is near to the brokenhearted And saves those who are crushed in spirit.',
        'The LORD is close to the brokenhearted; he rescues those whose spirits are crushed.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_grief, 1.00, 'God''s nearness in heartbreak - primary grief passage'),
        (scripture_id, topic_depression, 0.90, 'Promise of God''s presence in darkness'),
        (scripture_id, topic_loneliness, 0.85, 'God is near when we feel alone');

    -- Matthew 5:4
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Matt'),
        5, 4, NULL, 'Matthew 5:4',
        'Blessed are those who mourn, for they shall be comforted.',
        'Blessed are those who mourn, for they will be comforted.',
        'Blessed are they that mourn: for they shall be comforted.',
        'Blessed are those who mourn, for they shall be comforted.',
        'God blesses those who mourn, for they will be comforted.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_grief, 1.00, 'Jesus'' beatitude - blessing in mourning');

    -- John 11:35
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'John'),
        11, 35, NULL, 'John 11:35',
        'Jesus wept.',
        'Jesus wept.',
        'Jesus wept.',
        'Jesus wept.',
        'Then Jesus wept.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_grief, 0.95, 'Jesus enters into our grief - he weeps too');

    -- 2 Corinthians 1:3-4
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = '2Cor'),
        1, 3, 4, '2 Corinthians 1:3-4',
        'Blessed be the God and Father of our Lord Jesus Christ, the Father of mercies and God of all comfort, who comforts us in all our affliction, so that we may be able to comfort those who are in any affliction, with the comfort with which we ourselves are comforted by God.',
        'Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles, so that we can comfort those in any trouble with the comfort we ourselves receive from God.',
        'Blessed be God, even the Father of our Lord Jesus Christ, the Father of mercies, and the God of all comfort; Who comforteth us in all our tribulation, that we may be able to comfort them which are in any trouble, by the comfort wherewith we ourselves are comforted of God.',
        'Blessed be the God and Father of our Lord Jesus Christ, the Father of mercies and God of all comfort, who comforts us in all our affliction so that we will be able to comfort those who are in any affliction with the comfort with which we ourselves are comforted by God.',
        'All praise to God, the Father of our Lord Jesus Christ. God is our merciful Father and the source of all comfort. He comforts us in all our troubles so that we can comfort others. When they are troubled, we will be able to give them the same comfort God has given us.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_grief, 0.95, 'God as Father of comfort - purpose in pain'),
        (scripture_id, topic_purpose, 0.75, 'Our suffering equips us to comfort others');

    -- Revelation 21:4
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Rev'),
        21, 4, NULL, 'Revelation 21:4',
        'He will wipe away every tear from their eyes, and death shall be no more, neither shall there be mourning, nor crying, nor pain anymore, for the former things have passed away.',
        'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.',
        'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.',
        'and He will wipe away every tear from their eyes; and there will no longer be any death; there will no longer be any mourning, or crying, or pain; the first things have passed away.',
        'He will wipe every tear from their eyes, and there will be no more death or sorrow or crying or pain. All these things are gone forever.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_grief, 0.90, 'Future hope - no more tears'),
        (scripture_id, topic_hope, 0.95, 'Ultimate promise of restoration');

    -- Lamentations 3:22-23
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Lam'),
        3, 22, 23, 'Lamentations 3:22-23',
        'The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.',
        'Because of the LORD''s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.',
        'It is of the LORD''s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.',
        'The LORD''s lovingkindnesses indeed never cease, For His compassions never fail. They are new every morning; Great is Your faithfulness.',
        'The faithful love of the LORD never ends! His mercies never cease. Great is his faithfulness; his mercies begin afresh each morning.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_grief, 0.85, 'Hope in lament - mercies renewed'),
        (scripture_id, topic_hope, 0.95, 'Daily renewal of God''s mercies'),
        (scripture_id, topic_faith, 0.80, 'God''s faithfulness in dark times');

    -- ========================================================================
    -- FEAR & COURAGE SCRIPTURES
    -- ========================================================================

    -- Joshua 1:9
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Josh'),
        1, 9, NULL, 'Joshua 1:9',
        'Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the LORD your God is with you wherever you go.',
        'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.',
        'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.',
        'Have I not commanded you? Be strong and courageous! Do not tremble or be dismayed, for the LORD your God is with you wherever you go.',
        'This is my command—be strong and courageous! Do not be afraid or discouraged. For the LORD your God is with you wherever you go.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_fear, 1.00, 'Command and promise - God''s presence brings courage');

    -- 2 Timothy 1:7
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = '2Tim'),
        1, 7, NULL, '2 Timothy 1:7',
        'for God gave us a spirit not of fear but of power and love and self-control.',
        'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.',
        'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.',
        'For God has not given us a spirit of timidity, but of power and love and discipline.',
        'For God has not given us a spirit of fear and timidity, but of power, love, and self-discipline.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_fear, 1.00, 'Spirit of power not fear'),
        (scripture_id, topic_identity, 0.80, 'What God has given us');

    -- Psalm 27:1
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Ps'),
        27, 1, NULL, 'Psalm 27:1',
        'The LORD is my light and my salvation; whom shall I fear? The LORD is the stronghold of my life; of whom shall I be afraid?',
        'The LORD is my light and my salvation—whom shall I fear? The LORD is the stronghold of my life—of whom shall I be afraid?',
        'The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?',
        'The LORD is my light and my salvation; Whom shall I fear? The LORD is the defense of my life; Whom shall I dread?',
        'The LORD is my light and my salvation—so why should I be afraid? The LORD is my fortress, protecting me from danger, so why should I tremble?'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_fear, 0.95, 'David''s confidence in God as protector');

    -- Psalm 56:3
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Ps'),
        56, 3, NULL, 'Psalm 56:3',
        'When I am afraid, I put my trust in you.',
        'When I am afraid, I put my trust in you.',
        'What time I am afraid, I will trust in thee.',
        'When I am afraid, I will put my trust in You.',
        'But when I am afraid, I will put my trust in you.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_fear, 0.95, 'Honest acknowledgment of fear with choice to trust'),
        (scripture_id, topic_faith, 0.85, 'Trust as response to fear');

    -- ========================================================================
    -- FORGIVENESS SCRIPTURES
    -- ========================================================================

    -- Colossians 3:13
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Col'),
        3, 13, NULL, 'Colossians 3:13',
        'bearing with one another and, if one has a complaint against another, forgiving each other; as the Lord has forgiven you, so you also must forgive.',
        'Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you.',
        'Forbearing one another, and forgiving one another, if any man have a quarrel against any: even as Christ forgave you, so also do ye.',
        'bearing with one another, and forgiving each other, whoever has a complaint against anyone; just as the Lord forgave you, so also should you.',
        'Make allowance for each other''s faults, and forgive anyone who offends you. Remember, the Lord forgave you, so you must forgive others.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_forgiveness, 1.00, 'Forgive as Christ forgave');

    -- Ephesians 4:31-32
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Eph'),
        4, 31, 32, 'Ephesians 4:31-32',
        'Let all bitterness and wrath and anger and clamor and slander be put away from you, along with all malice. Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you.',
        'Get rid of all bitterness, rage and anger, brawling and slander, along with every form of malice. Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.',
        'Let all bitterness, and wrath, and anger, and clamour, and evil speaking, be put away from you, with all malice: And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ''s sake hath forgiven you.',
        'Let all bitterness and wrath and anger and clamor and slander be put away from you, along with all malice. Be kind to one another, tender-hearted, forgiving each other, just as God in Christ also has forgiven you.',
        'Get rid of all bitterness, rage, anger, harsh words, and slander, as well as all types of evil behavior. Instead, be kind to each other, tenderhearted, forgiving one another, just as God through Christ has forgiven you.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_forgiveness, 1.00, 'Putting away bitterness, being kind'),
        (scripture_id, topic_anger, 0.85, 'Dealing with anger and bitterness');

    -- Matthew 6:14-15
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Matt'),
        6, 14, 15, 'Matthew 6:14-15',
        'For if you forgive others their trespasses, your heavenly Father will also forgive you, but if you do not forgive others their trespasses, neither will your Father forgive your trespasses.',
        'For if you forgive other people when they sin against you, your heavenly Father will also forgive you. But if you do not forgive others their sins, your Father will not forgive your sins.',
        'For if ye forgive men their trespasses, your heavenly Father will also forgive you: But if ye forgive not men their trespasses, neither will your Father forgive your trespasses.',
        'For if you forgive others for their transgressions, your heavenly Father will also forgive you. But if you do not forgive others, then your Father will not forgive your transgressions.',
        'If you forgive those who sin against you, your heavenly Father will forgive you. But if you refuse to forgive others, your Father will not forgive your sins.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_forgiveness, 1.00, 'Jesus teaching on connection between receiving and giving forgiveness');

    -- ========================================================================
    -- FAITH & DOUBT SCRIPTURES
    -- ========================================================================

    -- Mark 9:24
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Mark'),
        9, 24, NULL, 'Mark 9:24',
        'Immediately the father of the child cried out and said, "I believe; help my unbelief!"',
        'Immediately the boy''s father exclaimed, "I do believe; help me overcome my unbelief!"',
        'And straightway the father of the child cried out, and said with tears, Lord, I believe; help thou mine unbelief.',
        'Immediately the boy''s father cried out and said, "I do believe; help my unbelief."',
        'The father instantly cried out, "I do believe, but help me overcome my unbelief!"'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_faith, 1.00, 'Honest prayer in midst of doubt');

    -- Hebrews 11:1
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Heb'),
        11, 1, NULL, 'Hebrews 11:1',
        'Now faith is the assurance of things hoped for, the conviction of things not seen.',
        'Now faith is confidence in what we hope for and assurance about what we do not see.',
        'Now faith is the substance of things hoped for, the evidence of things not seen.',
        'Now faith is the assurance of things hoped for, the conviction of things not seen.',
        'Faith shows the reality of what we hope for; it is the evidence of things we cannot see.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_faith, 1.00, 'Definition of faith');

    -- James 1:5-6
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Jas'),
        1, 5, 6, 'James 1:5-6',
        'If any of you lacks wisdom, let him ask God, who gives generously to all without reproach, and it will be given him. But let him ask in faith, with no doubting, for the one who doubts is like a wave of the sea that is driven and tossed by the wind.',
        'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you. But when you ask, you must believe and not doubt, because the one who doubts is like a wave of the sea, blown and tossed by the wind.',
        'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him. But let him ask in faith, nothing wavering. For he that wavereth is like a wave of the sea driven with the wind and tossed.',
        'But if any of you lacks wisdom, let him ask of God, who gives to all generously and without reproach, and it will be given to him. But he must ask in faith without any doubting, for the one who doubts is like the surf of the sea, driven and tossed by the wind.',
        'If you need wisdom, ask our generous God, and he will give it to you. He will not rebuke you for asking. But when you ask him, be sure that your faith is in God alone. Do not waver, for a person with divided loyalty is as unsettled as a wave of the sea that is blown and tossed by the wind.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_faith, 0.90, 'Asking in faith for wisdom'),
        (scripture_id, topic_wisdom, 0.95, 'God gives wisdom generously');

    -- Psalm 13:1-2
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Ps'),
        13, 1, 2, 'Psalm 13:1-2',
        'How long, O LORD? Will you forget me forever? How long will you hide your face from me? How long must I take counsel in my soul and have sorrow in my heart all the day? How long shall my enemy be exalted over me?',
        'How long, LORD? Will you forget me forever? How long will you hide your face from me? How long must I wrestle with my thoughts and day after day have sorrow in my heart? How long will my enemy triumph over me?',
        'How long wilt thou forget me, O LORD? for ever? how long wilt thou hide thy face from me? How long shall I take counsel in my soul, having sorrow in my heart daily? how long shall mine enemy be exalted over me?',
        'How long, O LORD? Will You forget me forever? How long will You hide Your face from me? How long shall I take counsel in my soul, Having sorrow in my heart all the day? How long will my enemy be exalted over me?',
        'O LORD, how long will you forget me? Forever? How long will you look the other way? How long must I struggle with anguish in my soul, with sorrow in my heart every day? How long will my enemy have the upper hand?'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_faith, 0.85, 'Honest questioning of God - lament'),
        (scripture_id, topic_depression, 0.90, 'Expressing darkness to God');

    -- ========================================================================
    -- PURPOSE & CALLING SCRIPTURES
    -- ========================================================================

    -- Jeremiah 29:11
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Jer'),
        29, 11, NULL, 'Jeremiah 29:11',
        'For I know the plans I have for you, declares the LORD, plans for welfare and not for evil, to give you a future and a hope.',
        'For I know the plans I have for you," declares the LORD, "plans to prosper you and not to harm you, plans to give you hope and a future.',
        'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.',
        'For I know the plans that I have for you,'' declares the LORD, ''plans for welfare and not for calamity to give you a future and a hope.',
        'For I know the plans I have for you," says the LORD. "They are plans for good and not for disaster, to give you a future and a hope.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_purpose, 1.00, 'God''s good plans - context is exile, not individual destiny'),
        (scripture_id, topic_hope, 0.95, 'Future and hope');

    -- Ephesians 2:10
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Eph'),
        2, 10, NULL, 'Ephesians 2:10',
        'For we are his workmanship, created in Christ Jesus for good works, which God prepared beforehand, that we should walk in them.',
        'For we are God''s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.',
        'For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.',
        'For we are His workmanship, created in Christ Jesus for good works, which God prepared beforehand so that we would walk in them.',
        'For we are God''s masterpiece. He has created us anew in Christ Jesus, so we can do the good things he planned for us long ago.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_purpose, 1.00, 'Created for good works'),
        (scripture_id, topic_identity, 0.95, 'God''s workmanship/masterpiece');

    -- Micah 6:8
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Mic'),
        6, 8, NULL, 'Micah 6:8',
        'He has told you, O man, what is good; and what does the LORD require of you but to do justice, and to love kindness, and to walk humbly with your God?',
        'He has shown you, O mortal, what is good. And what does the LORD require of you? To act justly and to love mercy and to walk humbly with your God.',
        'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?',
        'He has told you, O man, what is good; And what does the LORD require of you But to do justice, to love kindness, And to walk humbly with your God?',
        'No, O people, the LORD has told you what is good, and this is what he requires of you: to do what is right, to love mercy, and to walk humbly with your God.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_purpose, 0.95, 'Simple summary of what God requires');

    -- Proverbs 3:5-6
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Prov'),
        3, 5, 6, 'Proverbs 3:5-6',
        'Trust in the LORD with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.',
        'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
        'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
        'Trust in the LORD with all your heart And do not lean on your own understanding. In all your ways acknowledge Him, And He will make your paths straight.',
        'Trust in the LORD with all your heart; do not depend on your own understanding. Seek his will in all you do, and he will show you which path to take.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_purpose, 0.90, 'Guidance through trust'),
        (scripture_id, topic_faith, 0.90, 'Trust with whole heart'),
        (scripture_id, topic_wisdom, 0.85, 'Not leaning on own understanding');

    -- ========================================================================
    -- PEACE SCRIPTURES
    -- ========================================================================

    -- John 14:27
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'John'),
        14, 27, NULL, 'John 14:27',
        'Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.',
        'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.',
        'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.',
        'Peace I leave with you; My peace I give to you; not as the world gives do I give to you. Do not let your heart be troubled, nor let it be fearful.',
        'I am leaving you with a gift—peace of mind and heart. And the peace I give is a gift the world cannot give. So don''t be troubled or afraid.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_peace, 1.00, 'Jesus'' gift of peace'),
        (scripture_id, topic_anxiety, 0.85, 'Do not let hearts be troubled');

    -- Isaiah 26:3
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Isa'),
        26, 3, NULL, 'Isaiah 26:3',
        'You keep him in perfect peace whose mind is stayed on you, because he trusts in you.',
        'You will keep in perfect peace those whose minds are steadfast, because they trust in you.',
        'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.',
        'The steadfast of mind You will keep in perfect peace, Because he trusts in You.',
        'You will keep in perfect peace all who trust in you, all whose thoughts are fixed on you!'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_peace, 1.00, 'Perfect peace through focused trust'),
        (scripture_id, topic_faith, 0.85, 'Trust brings peace');

    -- Psalm 23:1-4
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Ps'),
        23, 1, 4, 'Psalm 23:1-4',
        'The LORD is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul. He leads me in paths of righteousness for his name''s sake. Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.',
        'The LORD is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul. He guides me along the right paths for his name''s sake. Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.',
        'The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul: he leadeth me in the paths of righteousness for his name''s sake. Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.',
        'The LORD is my shepherd, I shall not want. He makes me lie down in green pastures; He leads me beside quiet waters. He restores my soul; He guides me in the paths of righteousness For His name''s sake. Even though I walk through the valley of the shadow of death, I fear no evil, for You are with me; Your rod and Your staff, they comfort me.',
        'The LORD is my shepherd; I have all that I need. He lets me rest in green meadows; he leads me beside peaceful streams. He renews my strength. He guides me along right paths, bringing honor to his name. Even when I walk through the darkest valley, I will not be afraid, for you are close beside me. Your rod and your staff protect and comfort me.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_peace, 0.95, 'The Shepherd brings rest and guidance'),
        (scripture_id, topic_fear, 0.90, 'No fear in dark valley'),
        (scripture_id, topic_anxiety, 0.85, 'Green pastures, still waters'),
        (scripture_id, topic_grief, 0.80, 'Walking through shadow of death');

    -- ========================================================================
    -- IDENTITY IN CHRIST SCRIPTURES
    -- ========================================================================

    -- Romans 8:1
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Rom'),
        8, 1, NULL, 'Romans 8:1',
        'There is therefore now no condemnation for those who are in Christ Jesus.',
        'Therefore, there is now no condemnation for those who are in Christ Jesus.',
        'There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.',
        'Therefore there is now no condemnation for those who are in Christ Jesus.',
        'So now there is no condemnation for those who belong to Christ Jesus.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_identity, 1.00, 'No condemnation in Christ'),
        (scripture_id, topic_grace, 0.95, 'Freedom from condemnation');

    -- 2 Corinthians 5:17
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = '2Cor'),
        5, 17, NULL, '2 Corinthians 5:17',
        'Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.',
        'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
        'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
        'Therefore if anyone is in Christ, he is a new creature; the old things passed away; behold, new things have come.',
        'This means that anyone who belongs to Christ has become a new person. The old life is gone; a new life has begun!'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_identity, 1.00, 'New creation in Christ');

    -- 1 John 3:1
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = '1John'),
        3, 1, NULL, '1 John 3:1',
        'See what kind of love the Father has given to us, that we should be called children of God; and so we are. The reason why the world does not know us is that it did not know him.',
        'See what great love the Father has lavished on us, that we should be called children of God! And that is what we are! The reason the world does not know us is that it did not know him.',
        'Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God: therefore the world knoweth us not, because it knew him not.',
        'See how great a love the Father has bestowed on us, that we would be called children of God; and such we are. For this reason the world does not know us, because it did not know Him.',
        'See how very much our Father loves us, for he calls us his children, and that is what we are! But the people who belong to this world don''t recognize that we are God''s children because they don''t know him.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_identity, 1.00, 'Children of God'),
        (scripture_id, topic_love, 0.90, 'Father''s love for us');

    -- ========================================================================
    -- HOPE SCRIPTURES
    -- ========================================================================

    -- Romans 15:13
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Rom'),
        15, 13, NULL, 'Romans 15:13',
        'May the God of hope fill you with all joy and peace in believing, so that by the power of the Holy Spirit you may abound in hope.',
        'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.',
        'Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.',
        'Now may the God of hope fill you with all joy and peace in believing, so that you will abound in hope by the power of the Holy Spirit.',
        'I pray that God, the source of hope, will fill you completely with joy and peace because you trust in him. Then you will overflow with confident hope through the power of the Holy Spirit.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_hope, 1.00, 'God of hope - overflowing hope'),
        (scripture_id, topic_joy, 0.85, 'Joy and peace in believing');

    -- Romans 8:28
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Rom'),
        8, 28, NULL, 'Romans 8:28',
        'And we know that for those who love God all things work together for good, for those who are called according to his purpose.',
        'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
        'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
        'And we know that God causes all things to work together for good to those who love God, to those who are called according to His purpose.',
        'And we know that God causes everything to work together for the good of those who love God and are called according to his purpose for them.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_hope, 0.95, 'All things work together for good'),
        (scripture_id, topic_purpose, 0.85, 'Called according to purpose');

    -- Isaiah 40:31
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Isa'),
        40, 31, NULL, 'Isaiah 40:31',
        'but they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.',
        'but those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
        'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
        'Yet those who wait for the LORD Will gain new strength; They will mount up with wings like eagles, They will run and not get tired, They will walk and not become weary.',
        'But those who trust in the LORD will find new strength. They will soar high on wings like eagles. They will run and not grow weary. They will walk and not faint.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_hope, 1.00, 'Renewed strength through waiting/hoping'),
        (scripture_id, topic_faith, 0.80, 'Trust brings strength');

    -- Psalm 42:11
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Ps'),
        42, 11, NULL, 'Psalm 42:11',
        'Why are you cast down, O my soul, and why are you in turmoil within me? Hope in God; for I shall again praise him, my salvation and my God.',
        'Why, my soul, are you downcast? Why so disturbed within me? Put your hope in God, for I will yet praise him, my Savior and my God.',
        'Why art thou cast down, O my soul? and why art thou disquieted within me? hope thou in God: for I shall yet praise him, who is the health of my countenance, and my God.',
        'Why are you in despair, O my soul? And why have you become disturbed within me? Hope in God, for I shall yet praise Him, The help of my countenance and my God.',
        'Why am I discouraged? Why is my heart so sad? I will put my hope in God! I will praise him again—my Savior and my God!'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_hope, 0.95, 'Self-talk to hope in God'),
        (scripture_id, topic_depression, 0.90, 'Addressing the downcast soul');

    -- ========================================================================
    -- SALVATION & GRACE SCRIPTURES
    -- ========================================================================

    -- Ephesians 2:8-9
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Eph'),
        2, 8, 9, 'Ephesians 2:8-9',
        'For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.',
        'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—not by works, so that no one can boast.',
        'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.',
        'For by grace you have been saved through faith; and that not of yourselves, it is the gift of God; not as a result of works, so that no one may boast.',
        'God saved you by his grace when you believed. And you can''t take credit for this; it is a gift from God. Salvation is not a reward for the good things we have done, so none of us can boast about it.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_salvation, 1.00, 'Salvation by grace through faith'),
        (scripture_id, topic_grace, 1.00, 'Grace as gift');

    -- John 3:16
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'John'),
        3, 16, NULL, 'John 3:16',
        'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
        'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
        'For God so loved the world, that He gave His only begotten Son, that whoever believes in Him shall not perish, but have eternal life.',
        'For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_salvation, 1.00, 'Gospel in a verse'),
        (scripture_id, topic_love, 0.95, 'God''s love demonstrated');

    -- Romans 5:8
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Rom'),
        5, 8, NULL, 'Romans 5:8',
        'but God shows his love for us in that while we were still sinners, Christ died for us.',
        'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.',
        'But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.',
        'But God demonstrates His own love toward us, in that while we were yet sinners, Christ died for us.',
        'But God showed his great love for us by sending Christ to die for us while we were still sinners.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_grace, 1.00, 'Grace while still sinners'),
        (scripture_id, topic_love, 0.95, 'God''s initiative in love');

    -- ========================================================================
    -- PRAYER SCRIPTURES
    -- ========================================================================

    -- Matthew 7:7-8
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Matt'),
        7, 7, 8, 'Matthew 7:7-8',
        'Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you. For everyone who asks receives, and the one who seeks finds, and to the one who knocks it will be opened.',
        'Ask and it will be given to you; seek and you will find; knock and the door will be opened to you. For everyone who asks receives; the one who seeks finds; and to the one who knocks, the door will be opened.',
        'Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you: For every one that asketh receiveth; and he that seeketh findeth; and to him that knocketh it shall be opened.',
        'Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you. For everyone who asks receives, and he who seeks finds, and to him who knocks it will be opened.',
        'Keep on asking, and you will receive what you ask for. Keep on seeking, and you will find. Keep on knocking, and the door will be opened to you. For everyone who asks, receives. Everyone who seeks, finds. And to everyone who knocks, the door will be opened.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_prayer, 1.00, 'Invitation to persistent prayer');

    -- 1 Thessalonians 5:16-18
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = '1Thess'),
        5, 16, 18, '1 Thessalonians 5:16-18',
        'Rejoice always, pray without ceasing, give thanks in all circumstances; for this is the will of God in Christ Jesus for you.',
        'Rejoice always, pray continually, give thanks in all circumstances; for this is God''s will for you in Christ Jesus.',
        'Rejoice evermore. Pray without ceasing. In every thing give thanks: for this is the will of God in Christ Jesus concerning you.',
        'Rejoice always; pray without ceasing; in everything give thanks; for this is God''s will for you in Christ Jesus.',
        'Always be joyful. Never stop praying. Be thankful in all circumstances, for this is God''s will for you who belong to Christ Jesus.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_prayer, 1.00, 'Pray without ceasing'),
        (scripture_id, topic_gratitude, 0.90, 'Give thanks in all circumstances'),
        (scripture_id, topic_joy, 0.85, 'Rejoice always');

    -- ========================================================================
    -- JOY & GRATITUDE SCRIPTURES
    -- ========================================================================

    -- Nehemiah 8:10
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Neh'),
        8, 10, NULL, 'Nehemiah 8:10',
        'Then he said to them, "Go your way. Eat the fat and drink sweet wine and send portions to anyone who has nothing ready, for this day is holy to our Lord. And do not be grieved, for the joy of the LORD is your strength."',
        'Nehemiah said, "Go and enjoy choice food and sweet drinks, and send some to those who have nothing prepared. This day is holy to our Lord. Do not grieve, for the joy of the LORD is your strength."',
        'Then he said unto them, Go your way, eat the fat, and drink the sweet, and send portions unto them for whom nothing is prepared: for this day is holy unto our Lord: neither be ye sorry; for the joy of the LORD is your strength.',
        'Then he said to them, "Go, eat of the fat, drink of the sweet, and send portions to him who has nothing prepared; for this day is holy to our Lord. Do not be grieved, for the joy of the LORD is your strength."',
        'And Nehemiah continued, "Go and celebrate with a feast of rich foods and sweet drinks, and share gifts of food with people who have nothing prepared. This is a sacred day before our Lord. Don''t be dejected and sad, for the joy of the LORD is your strength!"'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_joy, 1.00, 'Joy of the LORD is strength');

    -- James 1:2-4
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Jas'),
        1, 2, 4, 'James 1:2-4',
        'Count it all joy, my brothers, when you meet trials of various kinds, for you know that the testing of your faith produces steadfastness. And let steadfastness have its full effect, that you may be perfect and complete, lacking in nothing.',
        'Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance. Let perseverance finish its work so that you may be mature and complete, not lacking anything.',
        'My brethren, count it all joy when ye fall into divers temptations; Knowing this, that the trying of your faith worketh patience. But let patience have her perfect work, that ye may be perfect and entire, wanting nothing.',
        'Consider it all joy, my brethren, when you encounter various trials, knowing that the testing of your faith produces endurance. And let endurance have its perfect result, so that you may be perfect and complete, lacking in nothing.',
        'Dear brothers and sisters, when troubles of any kind come your way, consider it an opportunity for great joy. For you know that when your faith is tested, your endurance has a chance to grow. So let it grow, for when your endurance is fully developed, you will be perfect and complete, needing nothing.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_joy, 0.90, 'Joy in trials'),
        (scripture_id, topic_faith, 0.85, 'Testing produces steadfastness');

    -- Psalm 100:4-5
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Ps'),
        100, 4, 5, 'Psalm 100:4-5',
        'Enter his gates with thanksgiving, and his courts with praise! Give thanks to him; bless his name! For the LORD is good; his steadfast love endures forever, and his faithfulness to all generations.',
        'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name. For the LORD is good and his love endures forever; his faithfulness continues through all generations.',
        'Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name. For the LORD is good; his mercy is everlasting; and his truth endureth to all generations.',
        'Enter His gates with thanksgiving And His courts with praise. Give thanks to Him, bless His name. For the LORD is good; His lovingkindness is everlasting And His faithfulness to all generations.',
        'Enter his gates with thanksgiving; go into his courts with praise. Give thanks to him and praise his name. For the LORD is good. His unfailing love continues forever, and his faithfulness continues to each generation.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_gratitude, 1.00, 'Entering with thanksgiving'),
        (scripture_id, topic_joy, 0.85, 'Praise and thanksgiving');

    -- ========================================================================
    -- LONELINESS SCRIPTURES
    -- ========================================================================

    -- Deuteronomy 31:6
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Deut'),
        31, 6, NULL, 'Deuteronomy 31:6',
        'Be strong and courageous. Do not fear or be in dread of them, for it is the LORD your God who goes with you. He will not leave you or forsake you.',
        'Be strong and courageous. Do not be afraid or terrified because of them, for the LORD your God goes with you; he will never leave you nor forsake you.',
        'Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee.',
        'Be strong and courageous, do not be afraid or tremble at them, for the LORD your God is the one who goes with you. He will not fail you or forsake you.',
        'So be strong and courageous! Do not be afraid and do not panic before them. For the LORD your God will personally go ahead of you. He will neither fail you nor abandon you.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_loneliness, 1.00, 'God will not leave or forsake'),
        (scripture_id, topic_fear, 0.85, 'Courage from God''s presence');

    -- Hebrews 13:5
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Heb'),
        13, 5, NULL, 'Hebrews 13:5',
        'Keep your life free from love of money, and be content with what you have, for he has said, "I will never leave you nor forsake you."',
        'Keep your lives free from the love of money and be content with what you have, because God has said, "Never will I leave you; never will I forsake you."',
        'Let your conversation be without covetousness; and be content with such things as ye have: for he hath said, I will never leave thee, nor forsake thee.',
        'Make sure that your character is free from the love of money, being content with what you have; for He Himself has said, "I WILL NEVER DESERT YOU, NOR WILL I EVER FORSAKE YOU,"',
        'Don''t love money; be satisfied with what you have. For God has said, "I will never fail you. I will never abandon you."'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_loneliness, 0.95, 'Never leave nor forsake');

    -- Matthew 28:20
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Matt'),
        28, 20, NULL, 'Matthew 28:20',
        'teaching them to observe all that I have commanded you. And behold, I am with you always, to the end of the age.',
        'and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age.',
        'Teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you alway, even unto the end of the world. Amen.',
        'teaching them to observe all that I commanded you; and lo, I am with you always, even to the end of the age.',
        'Teach these new disciples to obey all the commands I have given you. And be sure of this: I am with you always, even to the end of the age.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_loneliness, 0.95, 'Jesus with us always');

    -- ========================================================================
    -- DEPRESSION / DARKNESS SCRIPTURES
    -- ========================================================================

    -- Psalm 40:1-3
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Ps'),
        40, 1, 3, 'Psalm 40:1-3',
        'I waited patiently for the LORD; he inclined to me and heard my cry. He drew me up from the pit of destruction, out of the miry bog, and set my feet upon a rock, making my steps secure. He put a new song in my mouth, a song of praise to our God. Many will see and fear, and put their trust in the LORD.',
        'I waited patiently for the LORD; he turned to me and heard my cry. He lifted me out of the slimy pit, out of the mud and mire; he set my feet on a rock and gave me a firm place to stand. He put a new song in my mouth, a hymn of praise to our God. Many will see and fear the LORD and put their trust in him.',
        'I waited patiently for the LORD; and he inclined unto me, and heard my cry. He brought me up also out of an horrible pit, out of the miry clay, and set my feet upon a rock, and established my goings. And he hath put a new song in my mouth, even praise unto our God: many shall see it, and fear, and shall trust in the LORD.',
        'I waited patiently for the LORD; And He inclined to me and heard my cry. He brought me up out of the pit of destruction, out of the miry clay, And He set my feet upon a rock making my footsteps firm. He put a new song in my mouth, a song of praise to our God; Many will see and fear And will trust in the LORD.',
        'I waited patiently for the LORD to help me, and he turned to me and heard my cry. He lifted me out of the pit of despair, out of the mud and the mire. He set my feet on solid ground and steadied me as I walked along. He has given me a new song to sing, a hymn of praise to our God. Many will see what he has done and be amazed. They will put their trust in the LORD.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_depression, 1.00, 'Lifted from the pit'),
        (scripture_id, topic_hope, 0.90, 'New song after deliverance');

    -- Psalm 143:7-8
    INSERT INTO scripture_verses (book_id, chapter, verse_start, verse_end, reference,
        text_esv, text_niv, text_kjv, text_nasb, text_nlt)
    VALUES (
        (SELECT id FROM bible_books WHERE abbreviation = 'Ps'),
        143, 7, 8, 'Psalm 143:7-8',
        'Answer me quickly, O LORD! My spirit fails! Hide not your face from me, lest I be like those who go down to the pit. Let me hear in the morning of your steadfast love, for in you I trust. Make me know the way I should go, for to you I lift up my soul.',
        'Answer me quickly, LORD; my spirit fails. Do not hide your face from me or I will be like those who go down to the pit. Let the morning bring me word of your unfailing love, for I have put my trust in you. Show me the way I should go, for to you I entrust my life.',
        'Hear me speedily, O LORD: my spirit faileth: hide not thy face from me, lest I be like unto them that go down into the pit. Cause me to hear thy lovingkindness in the morning; for in thee do I trust: cause me to know the way wherein I should walk; for I lift up my soul unto thee.',
        'Answer me quickly, O LORD, my spirit fails; Do not hide Your face from me, Or I will become like those who go down to the pit. Let me hear Your lovingkindness in the morning; For I trust in You; Teach me the way in which I should walk; For to You I lift up my soul.',
        'Come quickly, LORD, and answer me, for my depression deepens. Don''t turn away from me, or I will die. Let me hear of your unfailing love each morning, for I am trusting you. Show me where to walk, for I give myself to you.'
    ) RETURNING id INTO scripture_id;
    
    INSERT INTO scripture_topic_mappings (scripture_id, topic_id, relevance_score, context_notes)
    VALUES 
        (scripture_id, topic_depression, 0.95, 'Honest prayer in darkness');

    RAISE NOTICE 'Scripture seed completed successfully';
    
END $$;

-- ============================================================================
-- CREATE FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Update search vectors for all verses
UPDATE scripture_verses SET search_vector = 
    setweight(to_tsvector('english', COALESCE(reference, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(text_esv, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(text_niv, '')), 'C');

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_scripture_search ON scripture_verses USING GIN(search_vector);

-- Create indexes for topic lookups
CREATE INDEX IF NOT EXISTS idx_scripture_topic_map_scripture ON scripture_topic_mappings(scripture_id);
CREATE INDEX IF NOT EXISTS idx_scripture_topic_map_topic ON scripture_topic_mappings(topic_id);
CREATE INDEX IF NOT EXISTS idx_scripture_topic_map_relevance ON scripture_topic_mappings(topic_id, relevance_score DESC);

-- ============================================================================
-- HELPER FUNCTIONS FOR SCRIPTURE RETRIEVAL
-- ============================================================================

-- Function to get scriptures by topic with translation preference
CREATE OR REPLACE FUNCTION get_scriptures_by_topic(
    p_topic_name VARCHAR,
    p_version VARCHAR DEFAULT 'ESV',
    p_limit INTEGER DEFAULT 5,
    p_include_apocrypha BOOLEAN DEFAULT false
)
RETURNS TABLE (
    reference VARCHAR,
    text TEXT,
    relevance_score DECIMAL,
    context_notes TEXT,
    book_name VARCHAR,
    testament VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sv.reference,
        CASE p_version
            WHEN 'NIV' THEN sv.text_niv
            WHEN 'KJV' THEN sv.text_kjv
            WHEN 'NASB' THEN sv.text_nasb
            WHEN 'NLT' THEN sv.text_nlt
            ELSE sv.text_esv
        END AS text,
        stm.relevance_score,
        stm.context_notes,
        bb.name AS book_name,
        bb.testament
    FROM scripture_verses sv
    JOIN scripture_topic_mappings stm ON sv.id = stm.scripture_id
    JOIN scripture_topics st ON stm.topic_id = st.id
    JOIN bible_books bb ON sv.book_id = bb.id
    WHERE st.name ILIKE p_topic_name
    AND (p_include_apocrypha OR bb.is_canonical = true)
    ORDER BY stm.relevance_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to search scriptures by keyword
CREATE OR REPLACE FUNCTION search_scriptures(
    p_query TEXT,
    p_version VARCHAR DEFAULT 'ESV',
    p_limit INTEGER DEFAULT 10,
    p_include_apocrypha BOOLEAN DEFAULT false
)
RETURNS TABLE (
    reference VARCHAR,
    text TEXT,
    book_name VARCHAR,
    testament VARCHAR,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sv.reference,
        CASE p_version
            WHEN 'NIV' THEN sv.text_niv
            WHEN 'KJV' THEN sv.text_kjv
            WHEN 'NASB' THEN sv.text_nasb
            WHEN 'NLT' THEN sv.text_nlt
            ELSE sv.text_esv
        END AS text,
        bb.name AS book_name,
        bb.testament,
        ts_rank(sv.search_vector, plainto_tsquery('english', p_query)) AS rank
    FROM scripture_verses sv
    JOIN bible_books bb ON sv.book_id = bb.id
    WHERE sv.search_vector @@ plainto_tsquery('english', p_query)
    AND (p_include_apocrypha OR bb.is_canonical = true)
    ORDER BY rank DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get random scripture by topic (for devotionals)
CREATE OR REPLACE FUNCTION get_random_scripture_by_topic(
    p_topic_name VARCHAR,
    p_version VARCHAR DEFAULT 'ESV',
    p_include_apocrypha BOOLEAN DEFAULT false
)
RETURNS TABLE (
    reference VARCHAR,
    text TEXT,
    context_notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sv.reference,
        CASE p_version
            WHEN 'NIV' THEN sv.text_niv
            WHEN 'KJV' THEN sv.text_kjv
            WHEN 'NASB' THEN sv.text_nasb
            WHEN 'NLT' THEN sv.text_nlt
            ELSE sv.text_esv
        END AS text,
        stm.context_notes
    FROM scripture_verses sv
    JOIN scripture_topic_mappings stm ON sv.id = stm.scripture_id
    JOIN scripture_topics st ON stm.topic_id = st.id
    JOIN bible_books bb ON sv.book_id = bb.id
    WHERE st.name ILIKE p_topic_name
    AND (p_include_apocrypha OR bb.is_canonical = true)
    ORDER BY RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- END OF SCRIPTURE SEED
-- ============================================================================
