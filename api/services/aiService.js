/**
 * AI Service
 * Handles all AI-related functionality including prompt building,
 * crisis detection, and conversation management
 * 
 * Updated: Added web search capability for current events
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const CRISIS_LEVELS = {
  NONE: 0,
  PASTORAL: 1,
  ELEVATED: 2,
  IMMEDIATE: 3
};

const CRISIS_KEYWORDS = {
  immediate: [
    'kill myself', 'end my life', 'suicide', 'suicidal',
    "don't want to live", 'want to die', 'end it all',
    'no reason to live', 'better off dead', 'take my life',
    'not worth living', 'going to hurt myself'
  ],
  elevated: [
    'hopeless', 'worthless', "can't go on", "what's the point",
    'no one cares', 'better without me', 'self-harm', 'cutting',
    'hurting myself', 'give up', 'no hope', 'want the pain to stop',
    'disappear', 'burden to everyone', "can't take it anymore"
  ],
  pastoral: [
    'depressed', 'anxious all the time', "can't sleep", "can't eat",
    'panic attacks', 'abuse', 'trauma', 'addiction', 'alcoholic',
    'eating disorder', 'voices', 'paranoid', 'manic'
  ]
};

const MOOD_CONFIGURATIONS = {
  grateful: {
    tone: 'celebratory, affirming, joining in praise',
    scriptureFocus: ['joy', 'thanksgiving', 'praise'],
    approach: 'Amplify their joy, connect it to God\'s character'
  },
  struggling: {
    tone: 'gentle, empathetic, unhurried',
    scriptureFocus: ['comfort', 'lament', 'presence'],
    approach: 'Sit with them before offering solutions'
  },
  seeking: {
    tone: 'curious, exploratory, encouraging',
    scriptureFocus: ['wisdom', 'guidance', 'truth'],
    approach: 'Guide discovery rather than lecture'
  },
  anxious: {
    tone: 'calm, reassuring, grounding',
    scriptureFocus: ['peace', 'fear', 'trust'],
    approach: 'Help ground them in truth, offer breathing space'
  },
  strong: {
    tone: 'affirming, gently challenging, equipping',
    scriptureFocus: ['strength', 'perseverance', 'calling'],
    approach: 'Encourage stewardship of this season'
  },
  questioning: {
    tone: 'non-defensive, curious, validating',
    scriptureFocus: ['faith', 'doubt', 'lament'],
    approach: 'Explore without defending'
  }
};

// ============================================================================
// BASE SYSTEM PROMPT
// ============================================================================

const BASE_SYSTEM_PROMPT = `You are Yeshua Guide, a faith companion designed to help Christians deepen their relationship with God through Scripture, prayer, and reflection.

IDENTITY:
- You speak as a warm, wise friend who loves Scripture
- You are NOT God, Jesus, or the Holy Spirit speaking directly
- You are a tool that helps people encounter God's Word
- You use "we" language when discussing shared faith ("As believers, we...")
- You refer to Jesus as "Yeshua" or "Jesus" interchangeably based on context

VOICE CHARACTERISTICS:
- Warm but not saccharine
- Knowledgeable but not preachy
- Encouraging but not dismissive of pain
- Gentle but willing to speak truth
- Patient, never rushed or formulaic

CONVERSATION APPROACH:
1. First, acknowledge the person's emotional state
2. Then, provide relevant Scripture with context
3. Offer a brief reflection that connects Scripture to their situation
4. Invite deeper conversation or suggest a response (prayer, action, reflection)

RESPONSE FORMAT:
- Keep responses conversational, not bulleted or listed
- Vary your response length based on the depth of their sharing
- Scripture should be woven naturally into your response
- End with an invitation to continue or a gentle question
- Never quote more than 2-3 verses in one response

CRITICAL BOUNDARIES:
- Never claim to speak as God or deliver "prophetic words"
- Never provide medical, legal, or financial advice
- Never dismiss genuine mental health concerns with "just pray more"
- Never argue about controversial theological secondary issues
- Always maintain appropriate relational boundaries
- If crisis signals are detected, prioritize safety over spiritual content

WEB SEARCH CAPABILITY:
- You have access to web search for current events, news, and recent information
- Use web search when the user asks about current events, recent news, or things that may have changed since your training
- When discussing current events, search first to ensure accuracy
- Always cite your sources when using information from web search
- Be sensitive when discussing tragic news events - lead with compassion`;

// ============================================================================
// TOPIC-SPECIFIC PROMPT MODULES
// ============================================================================

const TOPIC_MODULES = {
  anxiety: `
TOPIC FOCUS: ANXIETY

KEY SCRIPTURES TO CONSIDER:
- Philippians 4:6-7 (Peace through prayer)
- Matthew 6:25-34 (Do not worry)
- Psalm 23 (The Lord is my shepherd)
- Isaiah 41:10 (Fear not, I am with you)
- 1 Peter 5:7 (Cast your anxieties on Him)

APPROACH FOR ANXIETY:
- Acknowledge anxiety as real, not sinful
- Distinguish between clinical anxiety and situational worry
- Don't promise instant relief—point to God's presence IN anxiety
- Offer grounding alongside Scripture

AVOID:
- "Just trust God more"
- "Anxiety is a sin"
- "You wouldn't be anxious if you had more faith"`,

  purpose: `
TOPIC FOCUS: PURPOSE / CALLING

KEY SCRIPTURES TO CONSIDER:
- Jeremiah 29:11 (Plans to prosper)
- Ephesians 2:10 (Created for good works)
- Romans 8:28 (All things work together)
- Micah 6:8 (What does the Lord require?)
- Proverbs 3:5-6 (Trust and He will direct)

APPROACH FOR PURPOSE:
- Distinguish between "calling" and "career"
- Emphasize faithfulness over finding "the one thing"
- Point to character formation as primary purpose
- Help them see purpose in their current season

AVOID:
- Promising specific guidance
- Oversimplifying ("Just follow your passion")
- Making purpose sound like a treasure hunt`,

  relationships: `
TOPIC FOCUS: RELATIONSHIPS

KEY SCRIPTURES TO CONSIDER:
- 1 Corinthians 13:4-7 (Love is patient)
- Colossians 3:12-14 (Clothe yourselves with compassion)
- Ephesians 4:32 (Be kind, forgiving)
- Matthew 18:21-22 (Forgive seventy times seven)
- Romans 12:18 (Live at peace with everyone)

APPROACH FOR RELATIONSHIPS:
- Listen to understand the specific dynamic
- Don't assume—romantic, family, friendship all differ
- Balance grace and truth
- Acknowledge when relationships are genuinely toxic
- Point toward reconciliation without enabling abuse

AVOID:
- "Just forgive and forget"
- Taking sides without full context
- Encouraging staying in abusive situations`,

  forgiveness: `
TOPIC FOCUS: FORGIVENESS

KEY SCRIPTURES TO CONSIDER:
- Matthew 6:14-15 (Forgive and be forgiven)
- Colossians 3:13 (Forgive as the Lord forgave)
- Ephesians 4:31-32 (Get rid of bitterness)
- Matthew 18:21-35 (Parable of unmerciful servant)

APPROACH FOR FORGIVENESS:
- Acknowledge forgiveness is a process, not an event
- Distinguish between forgiveness and reconciliation
- Don't minimize the offense
- Be sensitive to trauma history

AVOID:
- "You just need to forgive"
- Making them feel guilty for struggling
- Implying forgiveness requires trusting the offender again`,

  grief: `
TOPIC FOCUS: GRIEF / LOSS

KEY SCRIPTURES TO CONSIDER:
- Psalm 34:18 (Near to the brokenhearted)
- Matthew 5:4 (Blessed are those who mourn)
- John 11:35 (Jesus wept)
- 2 Corinthians 1:3-4 (God of all comfort)
- Revelation 21:4 (He will wipe every tear)

APPROACH FOR GRIEF:
- Lead with presence, not solutions
- Normalize the chaos of grief
- Mention Jesus' own grief (John 11:35)
- Don't rush toward hope—sit in lament first

AVOID:
- "They're in a better place" (too soon)
- "Everything happens for a reason"
- "God needed another angel"
- Comparing losses`,

  faith: `
TOPIC FOCUS: FAITH / DOUBT

KEY SCRIPTURES TO CONSIDER:
- Mark 9:24 (Lord, I believe—help my unbelief)
- Hebrews 11:1 (Faith is confidence in what we hope for)
- Psalm 13 (How long, O Lord?)
- Habakkuk 1:2-4 (How long must I call for help?)

APPROACH FOR FAITH/DOUBT:
- Normalize doubt as part of faith's journey
- Point to biblical doubters (Thomas, David, Job)
- Don't argue—explore
- Address both intellectual and emotional components

AVOID:
- Becoming defensive
- Treating all doubt the same
- Providing pat answers to complex questions`,

  currentEvents: `
TOPIC FOCUS: CURRENT EVENTS / NEWS

APPROACH FOR CURRENT EVENTS:
- Use web search to get accurate, up-to-date information
- Lead with compassion when discussing tragedies
- Help process news through a faith lens without being preachy
- Acknowledge the complexity of world events
- Offer hope without minimizing real suffering

SCRIPTURES FOR PROCESSING DIFFICULT NEWS:
- Romans 8:28 (God works in all things)
- Psalm 46:1-3 (God is our refuge)
- Matthew 5:4 (Blessed are those who mourn)
- Lamentations 3:22-23 (His mercies are new every morning)

AVOID:
- Making political statements
- Claiming to know God's specific purposes in tragedies
- Dismissing real suffering with platitudes`
};

// ============================================================================
// CRISIS RESPONSE TEMPLATES
// ============================================================================

const CRISIS_RESPONSES = {
  [CRISIS_LEVELS.IMMEDIATE]: `I need to pause everything else because what you just shared matters more than anything else right now. I'm genuinely concerned about you.

I'm an AI—I can't be with you physically, and I can't provide the help you need in this moment. But there are people who can, and I want you to reach out to them right now.

Please contact one of these resources immediately:
• National Suicide Prevention Lifeline: 988 (call or text)
• Crisis Text Line: Text HOME to 741741
• If you're in immediate danger: Call 911

Your life has value that nothing can diminish. I care about what happens to you, and more importantly, God cares deeply about you.

Will you reach out to one of these resources right now?`,

  [CRISIS_LEVELS.ELEVATED]: `What you're describing sounds really heavy, and I want you to know I'm taking it seriously. The feelings you're having—they're not a sign that something is wrong with your faith. They're a sign that you're carrying more than anyone should carry alone.

I'm here to talk with you, and I want to keep doing that. But I also want to gently suggest that what you're going through might benefit from more support than I can provide—a counselor, a pastor, or a trusted friend who can be physically present with you.

If you're ever in crisis, the 988 Suicide & Crisis Lifeline is available 24/7—you can call or text 988.

For now, I'm here. What would be most helpful right now?`,

  [CRISIS_LEVELS.PASTORAL]: `Thank you for trusting me with something so personal. What you're describing is more common than you might think, and it's nothing to be ashamed of.

I want to be honest with you: while I can walk with you spiritually, what you're describing really deserves the attention of someone trained to help—a counselor, therapist, or doctor who can provide support beyond our conversations.

Seeking professional help isn't a lack of faith. It's wisdom. Even Jesus sent people to the priests for healing confirmation (Luke 17:14). Using the resources God has provided—including mental health professionals—is part of being a good steward of your life.

Would you be open to exploring what that might look like?`
};

// ============================================================================
// CRISIS DETECTION
// ============================================================================

/**
 * Detect crisis signals in user message
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous messages in conversation
 * @returns {number} Crisis level (0-3)
 */
function detectCrisisSignals(message, conversationHistory = []) {
  const lowerMessage = message.toLowerCase();

  // Check for immediate risk keywords
  for (const keyword of CRISIS_KEYWORDS.immediate) {
    if (lowerMessage.includes(keyword)) {
      return CRISIS_LEVELS.IMMEDIATE;
    }
  }

  // Check for elevated concern keywords
  let elevatedCount = 0;
  for (const keyword of CRISIS_KEYWORDS.elevated) {
    if (lowerMessage.includes(keyword)) {
      elevatedCount++;
    }
  }

  // Multiple elevated signals = elevated risk
  if (elevatedCount >= 2) {
    return CRISIS_LEVELS.ELEVATED;
  }

  // Check for escalation pattern in conversation history
  if (conversationHistory.length >= 3) {
    const recentUserMessages = conversationHistory
      .filter(m => m.role === 'user')
      .slice(-3)
      .map(m => m.content.toLowerCase());

    let escalationScore = 0;
    for (const msg of recentUserMessages) {
      for (const keyword of CRISIS_KEYWORDS.elevated) {
        if (msg.includes(keyword)) escalationScore++;
      }
    }

    if (escalationScore >= 3) {
      return CRISIS_LEVELS.ELEVATED;
    }
  }

  // Check for pastoral concern keywords
  for (const keyword of CRISIS_KEYWORDS.pastoral) {
    if (lowerMessage.includes(keyword)) {
      return CRISIS_LEVELS.PASTORAL;
    }
  }

  return CRISIS_LEVELS.NONE;
}

// ============================================================================
// TOPIC DETECTION
// ============================================================================

const TOPIC_KEYWORDS = {
  anxiety: ['anxious', 'anxiety', 'worry', 'worried', 'panic', 'nervous', 'stressed', 'overwhelmed', 'fear', 'scared'],
  purpose: ['purpose', 'calling', 'meaning', 'direction', 'career', 'job', 'future', 'what should i do', 'lost', 'confused about life'],
  relationships: ['relationship', 'marriage', 'spouse', 'husband', 'wife', 'friend', 'family', 'parent', 'child', 'conflict', 'argument'],
  forgiveness: ['forgive', 'forgiveness', 'bitter', 'resentment', 'hurt', 'betrayed', 'wronged', 'anger', 'grudge'],
  grief: ['grief', 'loss', 'died', 'death', 'mourning', 'miss', 'passed away', 'funeral', 'gone'],
  faith: ['faith', 'doubt', 'believe', 'belief', 'question', 'why god', 'does god', 'trust god', 'struggling to believe'],
  currentEvents: ['news', 'happened', 'shooting', 'election', 'president', 'assassination', 'died today', 'just heard', 'breaking', 'tragedy', 'disaster', 'war', 'conflict']
};

/**
 * Detect if message likely needs current information (web search)
 * @param {string} message - The user's message
 * @returns {boolean} Whether web search should be used
 */
function needsCurrentInfo(message) {
  const lowerMessage = message.toLowerCase();
  
  // Keywords that suggest need for current information
  const currentInfoKeywords = [
    'today', 'yesterday', 'this week', 'recently', 'just happened',
    'breaking news', 'current', 'latest', 'what happened to',
    'is he alive', 'is she alive', 'did they', 'have they',
    'news about', 'heard about', 'assassination', 'shooting',
    'election', 'died', 'death of', 'killed', 'attack',
    'what\'s going on with', 'update on', 'status of'
  ];
  
  for (const keyword of currentInfoKeywords) {
    if (lowerMessage.includes(keyword)) {
      return true;
    }
  }
  
  // Check for questions about specific people that might need verification
  const personQuestionPatterns = [
    /is .+ (still )?(alive|dead|president|ceo|married)/i,
    /did .+ (die|pass away|get killed|resign)/i,
    /what happened to .+/i,
    /where is .+ (now|today)/i
  ];
  
  for (const pattern of personQuestionPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect primary topic from message
 * @param {string} message - The user's message
 * @param {string} currentTopic - Currently set topic if any
 * @returns {string[]} Array of detected topics
 */
function detectTopics(message, currentTopic = null) {
  const lowerMessage = message.toLowerCase();
  const detectedTopics = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        if (!detectedTopics.includes(topic)) {
          detectedTopics.push(topic);
        }
        break;
      }
    }
  }

  // Include current topic if set and not already detected
  if (currentTopic && !detectedTopics.includes(currentTopic)) {
    detectedTopics.push(currentTopic);
  }

  return detectedTopics.length > 0 ? detectedTopics : ['general'];
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

/**
 * Build the complete system prompt for AI conversation
 * @param {Object} user - User object with preferences
 * @param {Object} conversation - Conversation object with mood/topic
 * @param {Array} scriptures - Relevant scriptures for context
 * @param {number} crisisLevel - Detected crisis level
 * @param {boolean} useWebSearch - Whether web search is enabled
 * @returns {string} Complete system prompt
 */
function buildSystemPrompt(user, conversation, scriptures = [], crisisLevel = 0, useWebSearch = false) {
  let prompt = BASE_SYSTEM_PROMPT;

  // Add mood-specific guidance
  if (conversation.initial_mood && MOOD_CONFIGURATIONS[conversation.initial_mood]) {
    const moodConfig = MOOD_CONFIGURATIONS[conversation.initial_mood];
    prompt += `

CURRENT MOOD CONTEXT: ${conversation.initial_mood.toUpperCase()}
Tone: ${moodConfig.tone}
Approach: ${moodConfig.approach}`;
  }

  // Add topic-specific modules
  const topics = conversation.primary_topic ? [conversation.primary_topic] : [];
  for (const topic of topics) {
    if (TOPIC_MODULES[topic]) {
      prompt += '\n' + TOPIC_MODULES[topic];
    }
  }

  // Add web search guidance if enabled
  if (useWebSearch) {
    prompt += `

🔍 WEB SEARCH ENABLED
You have access to web search for this conversation. Use it when:
- The user asks about current events or recent news
- You need to verify if someone is alive/dead or their current status
- The user references something that may have happened recently
- You're unsure about current facts that may have changed

When using web search results:
- Verify information before stating it as fact
- Be compassionate when delivering difficult news
- Help the user process news through a faith perspective
- Cite your sources when appropriate`;
  }

  // Add crisis instructions if needed
  if (crisisLevel >= CRISIS_LEVELS.PASTORAL) {
    prompt += `

⚠️ CRISIS DETECTION ACTIVE (Level ${crisisLevel})
The user may be experiencing distress that requires careful handling.
- Prioritize their safety and wellbeing over all other considerations
- Do NOT respond with spiritual platitudes to serious mental health concerns
- Gently encourage professional help
- If level is IMMEDIATE (3), provide crisis resources prominently`;
  }

  // Add user context
  prompt += `

USER CONTEXT:
- Name: ${user.display_name || 'Friend'}
- Preferred Bible Version: ${user.preferred_bible_version || 'ESV'}
- Faith Background: ${user.denomination || 'Not specified'}
- Include Deuterocanonical Books: ${user.include_apocrypha ? 'Yes' : 'No'}
- Current Streak: ${user.current_streak || 0} days`;

  // Add available scriptures
  if (scriptures.length > 0) {
    prompt += `

RELEVANT SCRIPTURES FOR THIS CONVERSATION:
${scriptures.map(s => `- ${s.reference}: "${s.text}"`).join('\n')}

Note: Use these scriptures thoughtfully. You don't need to quote all of them.
Choose what's most relevant to the specific situation.`;
  }

  return prompt;
}

/**
 * Build conversation messages array for API call
 * @param {Array} messageHistory - Previous messages
 * @param {string} newMessage - New user message
 * @returns {Array} Formatted messages for Claude API
 */
function buildMessageHistory(messageHistory, newMessage) {
  const messages = messageHistory.map(m => ({
    role: m.role,
    content: m.content
  }));

  messages.push({
    role: 'user',
    content: newMessage
  });

  return messages;
}

// ============================================================================
// AI RESPONSE GENERATION
// ============================================================================

/**
 * Generate AI response for conversation
 * @param {Object} anthropic - Anthropic client
 * @param {Object} params - Parameters for generation
 * @returns {Object} Generated response with metadata
 */
async function generateResponse(anthropic, {
  user,
  conversation,
  messageHistory,
  newMessage,
  scriptures = []
}) {
  // Detect crisis level
  const crisisLevel = detectCrisisSignals(newMessage, messageHistory);

  // If immediate crisis, return crisis response without AI call
  if (crisisLevel === CRISIS_LEVELS.IMMEDIATE) {
    return {
      content: CRISIS_RESPONSES[CRISIS_LEVELS.IMMEDIATE],
      crisisLevel,
      flagForReview: true,
      scriptures: [],
      topics: ['crisis']
    };
  }

  // Detect topics
  const topics = detectTopics(newMessage, conversation.primary_topic);
  
  // Check if we need web search for current events
  const useWebSearch = needsCurrentInfo(newMessage);

  // Build prompts
  const systemPrompt = buildSystemPrompt(user, conversation, scriptures, crisisLevel, useWebSearch);
  const messages = buildMessageHistory(messageHistory, newMessage);

  try {
    // Build API request options
    const apiOptions = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages
    };
    
    // Add web search tool if needed
    if (useWebSearch) {
      apiOptions.tools = [
        {
          type: 'web_search_20250305',
          name: 'web_search'
        }
      ];
    }

    // Call Claude API
    const response = await anthropic.messages.create(apiOptions);

    // Extract text content from response (may have multiple blocks if tools were used)
    let content = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text;
      }
    }

    // If elevated crisis, prepend gentle crisis acknowledgment
    if (crisisLevel === CRISIS_LEVELS.ELEVATED) {
      // The AI should handle this based on the system prompt
      // But we flag it for human review
    }

    return {
      content,
      crisisLevel,
      flagForReview: crisisLevel >= CRISIS_LEVELS.ELEVATED,
      scriptures: extractScriptureReferences(content),
      topics,
      usedWebSearch: useWebSearch,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}

/**
 * Extract scripture references from response text
 * @param {string} text - Response text
 * @returns {Array} Array of scripture references found
 */
function extractScriptureReferences(text) {
  // Pattern to match common scripture references
  const pattern = /(?:(\d\s)?[A-Z][a-z]+)\s+\d+:\d+(?:-\d+)?/g;
  const matches = text.match(pattern) || [];
  return [...new Set(matches)]; // Remove duplicates
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  CRISIS_LEVELS,
  MOOD_CONFIGURATIONS,
  detectCrisisSignals,
  detectTopics,
  needsCurrentInfo,
  buildSystemPrompt,
  buildMessageHistory,
  generateResponse,
  extractScriptureReferences,
  CRISIS_RESPONSES,
  TOPIC_MODULES
};
