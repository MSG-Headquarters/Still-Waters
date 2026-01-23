import React, { useState, useEffect } from 'react';
import { Heart, Users, Book, MessageCircle, Sun, Moon, ChevronRight, Send, Plus, Settings, Home, Search, Bell, Sparkles, Feather, Cross, Flame, BookOpen, UserPlus, Calendar, Star, Check, Circle, ArrowLeft, MoreHorizontal } from 'lucide-react';

// Custom font injection
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Source+Sans+3:wght@300;400;500;600&display=swap');
`;

export default function YeshuaGuide() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentView, setCurrentView] = useState('main');
  const [mood, setMood] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Peace be with you. How is your heart today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showMoodSelector, setShowMoodSelector] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState('morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay('morning');
    else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon');
    else if (hour >= 17 && hour < 21) setTimeOfDay('evening');
    else setTimeOfDay('night');
  }, []);

  const moods = [
    { emoji: '😊', label: 'Grateful', color: '#E8B86D' },
    { emoji: '😔', label: 'Struggling', color: '#7B8794' },
    { emoji: '🙏', label: 'Seeking', color: '#A8D5BA' },
    { emoji: '😰', label: 'Anxious', color: '#D4A5A5' },
    { emoji: '💪', label: 'Strong', color: '#9DB4C0' },
    { emoji: '❓', label: 'Questioning', color: '#C9B1FF' },
  ];

  const dailyScripture = {
    verse: "Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls.",
    reference: "Matthew 11:28-29",
    reflection: "In moments of exhaustion—physical, emotional, spiritual—Yeshua extends an invitation, not a command. He doesn't say 'try harder.' He says 'come.' The rest He offers isn't escape from responsibility, but freedom from carrying it alone."
  };

  const studyGroups = [
    { name: 'Morning Light Circle', members: 7, book: 'Psalms', avatar: '🌅', lastActive: '2 hours ago', unread: 3 },
    { name: 'Faith & Work', members: 12, book: 'Proverbs', avatar: '⚒️', lastActive: '1 day ago', unread: 0 },
    { name: 'Seekers Journey', members: 4, book: 'John', avatar: '🕊️', lastActive: '3 hours ago', unread: 1 },
  ];

  const prayerRequests = [
    { user: 'Sarah M.', request: 'Healing for my mother', time: '4h ago', prayers: 12 },
    { user: 'James K.', request: 'Guidance in career transition', time: '6h ago', prayers: 8 },
    { user: 'Anonymous', request: 'Strength through difficult season', time: '1d ago', prayers: 24 },
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newMessages = [
      ...messages,
      { role: 'user', content: inputValue }
    ];
    setMessages(newMessages);
    setInputValue('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages([
        ...newMessages,
        { 
          role: 'assistant', 
          content: getContextualResponse(inputValue, mood)
        }
      ]);
    }, 1500);
  };

  const getContextualResponse = (input, currentMood) => {
    const responses = {
      anxious: `I hear the weight in your words. Remember what is written in Philippians 4:6-7: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds."\n\nWhat specifically is troubling your heart today?`,
      struggling: `You are not alone in this valley. Even David, a man after God's own heart, wrote: "Why, my soul, are you downcast? Why so disturbed within me? Put your hope in God, for I will yet praise him, my Savior and my God." (Psalm 42:11)\n\nWould you like to share more about what you're carrying?`,
      grateful: `What a gift to encounter you in this spirit of thanksgiving! "Give thanks to the Lord, for he is good; his love endures forever." (1 Chronicles 16:34)\n\nGratitude opens our eyes to see God's hand in every moment. What has stirred this thankfulness in you?`,
      default: `Thank you for sharing your heart with me. As it says in Proverbs 3:5-6, "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."\n\nTell me more about what's on your mind.`
    };
    
    return responses[currentMood?.label?.toLowerCase()] || responses.default;
  };

  const selectMood = (selectedMood) => {
    setMood(selectedMood);
    setShowMoodSelector(false);
    setMessages([
      ...messages,
      { role: 'user', content: `I'm feeling ${selectedMood.label.toLowerCase()} today.` },
      { role: 'assistant', content: getContextualResponse('', selectedMood) }
    ]);
  };

  const renderHome = () => (
    <div className="home-view">
      {/* Greeting Header */}
      <div className="greeting-section">
        <div className="greeting-text">
          <span className="greeting-label">Good {timeOfDay}</span>
          <h1 className="greeting-name">Koda</h1>
        </div>
        <div className="streak-badge">
          <Flame size={16} />
          <span>7 day streak</span>
        </div>
      </div>

      {/* Daily Devotional Card */}
      <div className="devotional-card">
        <div className="devotional-header">
          <div className="devotional-icon">
            <Feather size={20} />
          </div>
          <span className="devotional-label">Today's Word</span>
          <span className="devotional-date">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
        
        <blockquote className="scripture-text">
          "{dailyScripture.verse}"
        </blockquote>
        
        <cite className="scripture-reference">— {dailyScripture.reference}</cite>
        
        <div className="reflection-section">
          <h4>Reflection</h4>
          <p>{dailyScripture.reflection}</p>
        </div>

        <div className="devotional-actions">
          <button className="action-btn primary">
            <BookOpen size={16} />
            <span>Read More</span>
          </button>
          <button className="action-btn secondary">
            <MessageCircle size={16} />
            <span>Discuss</span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="quick-action-card" onClick={() => { setActiveTab('talk'); setCurrentView('chat'); }}>
          <div className="qa-icon talk">
            <MessageCircle size={24} />
          </div>
          <span>Talk to God</span>
        </button>
        <button className="quick-action-card" onClick={() => setActiveTab('community')}>
          <div className="qa-icon community">
            <Users size={24} />
          </div>
          <span>Fellowship</span>
        </button>
        <button className="quick-action-card">
          <div className="qa-icon prayer">
            <Heart size={24} />
          </div>
          <span>Prayer Wall</span>
        </button>
        <button className="quick-action-card">
          <div className="qa-icon study">
            <Book size={24} />
          </div>
          <span>Bible Study</span>
        </button>
      </div>

      {/* Active Studies */}
      <div className="section">
        <div className="section-header">
          <h3>Your Studies</h3>
          <button className="see-all">See all <ChevronRight size={16} /></button>
        </div>
        <div className="study-cards">
          {studyGroups.slice(0, 2).map((group, i) => (
            <div key={i} className="study-card">
              <div className="study-avatar">{group.avatar}</div>
              <div className="study-info">
                <h4>{group.name}</h4>
                <span className="study-book">{group.book}</span>
              </div>
              {group.unread > 0 && <div className="unread-badge">{group.unread}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Prayer Requests */}
      <div className="section">
        <div className="section-header">
          <h3>Prayer Requests</h3>
          <button className="see-all">See all <ChevronRight size={16} /></button>
        </div>
        <div className="prayer-list">
          {prayerRequests.slice(0, 2).map((prayer, i) => (
            <div key={i} className="prayer-card">
              <div className="prayer-content">
                <span className="prayer-user">{prayer.user}</span>
                <p className="prayer-text">{prayer.request}</p>
                <span className="prayer-meta">{prayer.time} · {prayer.prayers} prayers</span>
              </div>
              <button className="pray-btn">
                <Heart size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="chat-view">
      <div className="chat-header">
        <button className="back-btn" onClick={() => setCurrentView('main')}>
          <ArrowLeft size={20} />
        </button>
        <div className="chat-title">
          <div className="chat-avatar">
            <Sparkles size={20} />
          </div>
          <div>
            <h2>Talk with Yeshua</h2>
            <span className="chat-subtitle">Your faith companion</span>
          </div>
        </div>
        <button className="more-btn">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="chat-messages">
        {showMoodSelector && (
          <div className="mood-selector">
            <p className="mood-prompt">How are you feeling today?</p>
            <div className="mood-grid">
              {moods.map((m, i) => (
                <button 
                  key={i} 
                  className="mood-btn"
                  style={{ '--mood-color': m.color }}
                  onClick={() => selectMood(m)}
                >
                  <span className="mood-emoji">{m.emoji}</span>
                  <span className="mood-label">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="message-avatar">
                <Cross size={16} />
              </div>
            )}
            <div className="message-content">
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input-area">
        <div className="chat-input-container">
          <input
            type="text"
            placeholder="Share what's on your heart..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button className="send-btn" onClick={handleSendMessage}>
            <Send size={20} />
          </button>
        </div>
        <div className="topic-suggestions">
          <button className="topic-chip">Anxiety</button>
          <button className="topic-chip">Purpose</button>
          <button className="topic-chip">Relationships</button>
          <button className="topic-chip">Forgiveness</button>
        </div>
      </div>
    </div>
  );

  const renderCommunity = () => (
    <div className="community-view">
      <div className="community-header">
        <h1>Fellowship</h1>
        <button className="create-btn">
          <Plus size={20} />
        </button>
      </div>

      {/* Study Groups */}
      <div className="section">
        <div className="section-header">
          <h3>Bible Study Groups</h3>
          <button className="see-all">Browse <ChevronRight size={16} /></button>
        </div>
        <div className="groups-list">
          {studyGroups.map((group, i) => (
            <div key={i} className="group-card">
              <div className="group-avatar">{group.avatar}</div>
              <div className="group-info">
                <h4>{group.name}</h4>
                <p className="group-meta">{group.members} members · Studying {group.book}</p>
                <span className="group-active">{group.lastActive}</span>
              </div>
              {group.unread > 0 && <div className="unread-badge">{group.unread}</div>}
              <ChevronRight size={20} className="group-arrow" />
            </div>
          ))}
        </div>
      </div>

      {/* Prayer Wall */}
      <div className="section">
        <div className="section-header">
          <h3>Community Prayer Wall</h3>
          <button className="add-prayer">
            <Plus size={16} />
            Add Request
          </button>
        </div>
        <div className="prayer-wall">
          {prayerRequests.map((prayer, i) => (
            <div key={i} className="prayer-wall-card">
              <div className="prayer-header">
                <span className="prayer-author">{prayer.user}</span>
                <span className="prayer-time">{prayer.time}</span>
              </div>
              <p className="prayer-request">{prayer.request}</p>
              <div className="prayer-footer">
                <button className="pray-with-btn">
                  <Heart size={16} />
                  <span>Pray</span>
                  <span className="pray-count">{prayer.prayers}</span>
                </button>
                <button className="encourage-btn">
                  <MessageCircle size={16} />
                  <span>Encourage</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="section">
        <div className="section-header">
          <h3>Upcoming</h3>
        </div>
        <div className="events-list">
          <div className="event-card">
            <div className="event-date">
              <span className="event-day">15</span>
              <span className="event-month">JAN</span>
            </div>
            <div className="event-info">
              <h4>Morning Light Bible Study</h4>
              <p>Psalms Chapter 23 Discussion</p>
              <span className="event-time">7:00 AM · Virtual</span>
            </div>
            <button className="event-join">Join</button>
          </div>
        </div>
      </div>

      {/* Find Friends */}
      <div className="section">
        <div className="invite-card">
          <UserPlus size={32} />
          <div>
            <h4>Grow Together</h4>
            <p>Invite friends to join your faith journey</p>
          </div>
          <button className="invite-btn">Invite</button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeTab === 'talk' || currentView === 'chat') {
      return renderChat();
    }
    
    switch (activeTab) {
      case 'home':
        return renderHome();
      case 'community':
        return renderCommunity();
      default:
        return renderHome();
    }
  };

  return (
    <>
      <style>{fontStyles}</style>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .app-container {
          --bg-primary: #F7F5F0;
          --bg-secondary: #FFFFFF;
          --bg-tertiary: #EDE9E0;
          --text-primary: #2C2416;
          --text-secondary: #6B5D4D;
          --text-muted: #9C8B78;
          --accent-gold: #C4A35A;
          --accent-warm: #D4A574;
          --accent-sage: #8FA68A;
          --accent-sky: #7BA3B8;
          --accent-rose: #C9A5A5;
          --border-color: rgba(107, 93, 77, 0.15);
          --shadow-soft: 0 2px 12px rgba(44, 36, 22, 0.06);
          --shadow-medium: 0 4px 24px rgba(44, 36, 22, 0.1);
          
          font-family: 'Source Sans 3', -apple-system, sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
          min-height: 100vh;
          max-width: 430px;
          margin: 0 auto;
          position: relative;
          overflow-x: hidden;
        }

        .main-content {
          padding-bottom: 90px;
          min-height: 100vh;
        }

        /* ===== HOME VIEW ===== */
        .home-view {
          padding: 24px 20px;
        }

        .greeting-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
        }

        .greeting-label {
          font-size: 14px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .greeting-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 500;
          color: var(--text-primary);
          margin-top: 4px;
        }

        .streak-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #F4E4C1 0%, #E8D4A8 100%);
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          color: #8B7355;
        }

        .streak-badge svg {
          color: #D4A35A;
        }

        /* Devotional Card */
        .devotional-card {
          background: var(--bg-secondary);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: var(--shadow-soft);
          border: 1px solid var(--border-color);
        }

        .devotional-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .devotional-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-warm) 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .devotional-label {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          flex: 1;
        }

        .devotional-date {
          font-size: 13px;
          color: var(--text-muted);
        }

        .scripture-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-style: italic;
          font-weight: 400;
          line-height: 1.5;
          color: var(--text-primary);
          margin-bottom: 12px;
          border: none;
          padding: 0;
        }

        .scripture-reference {
          display: block;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 14px;
          font-style: normal;
          color: var(--accent-gold);
          font-weight: 600;
          margin-bottom: 20px;
        }

        .reflection-section {
          background: var(--bg-tertiary);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .reflection-section h4 {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .reflection-section p {
          font-size: 15px;
          line-height: 1.6;
          color: var(--text-primary);
        }

        .devotional-actions {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-warm) 100%);
          color: white;
        }

        .action-btn.secondary {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-medium);
        }

        /* Quick Actions */
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }

        .quick-action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 8px;
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-medium);
        }

        .qa-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .qa-icon.talk { background: linear-gradient(135deg, #7BA3B8 0%, #5B8FA8 100%); }
        .qa-icon.community { background: linear-gradient(135deg, #8FA68A 0%, #6B8B67 100%); }
        .qa-icon.prayer { background: linear-gradient(135deg, #C9A5A5 0%, #B08888 100%); }
        .qa-icon.study { background: linear-gradient(135deg, #C4A35A 0%, #A88B45 100%); }

        .quick-action-card span {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          text-align: center;
        }

        /* Sections */
        .section {
          margin-bottom: 28px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 600;
        }

        .see-all {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 500;
          color: var(--accent-gold);
          background: none;
          border: none;
          cursor: pointer;
        }

        /* Study Cards */
        .study-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .study-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 14px;
          border: 1px solid var(--border-color);
        }

        .study-avatar {
          width: 48px;
          height: 48px;
          background: var(--bg-tertiary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .study-info {
          flex: 1;
        }

        .study-info h4 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .study-book {
          font-size: 13px;
          color: var(--text-muted);
        }

        .unread-badge {
          width: 22px;
          height: 22px;
          background: var(--accent-gold);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        /* Prayer Cards */
        .prayer-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .prayer-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 14px;
          border: 1px solid var(--border-color);
        }

        .prayer-content {
          flex: 1;
        }

        .prayer-user {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .prayer-text {
          font-size: 15px;
          margin: 6px 0;
        }

        .prayer-meta {
          font-size: 12px;
          color: var(--text-muted);
        }

        .pray-btn {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #FFE4E4 0%, #FFD4D4 100%);
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-rose);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pray-btn:hover {
          transform: scale(1.1);
          background: linear-gradient(135deg, var(--accent-rose) 0%, #B08888 100%);
          color: white;
        }

        /* ===== CHAT VIEW ===== */
        .chat-view {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(180deg, #F7F5F0 0%, #EDE9E0 100%);
        }

        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
        }

        .back-btn, .more-btn {
          width: 40px;
          height: 40px;
          background: var(--bg-tertiary);
          border: none;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-primary);
          cursor: pointer;
        }

        .chat-title {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-avatar {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-warm) 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .chat-title h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 600;
        }

        .chat-subtitle {
          font-size: 13px;
          color: var(--text-muted);
        }

        .chat-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Mood Selector */
        .mood-selector {
          background: var(--bg-secondary);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 16px;
          box-shadow: var(--shadow-soft);
        }

        .mood-prompt {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          text-align: center;
          margin-bottom: 20px;
          color: var(--text-primary);
        }

        .mood-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .mood-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 12px;
          background: var(--bg-tertiary);
          border: 2px solid transparent;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mood-btn:hover {
          border-color: var(--mood-color);
          background: white;
          transform: translateY(-2px);
        }

        .mood-emoji {
          font-size: 28px;
        }

        .mood-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        /* Messages */
        .message {
          display: flex;
          gap: 12px;
          max-width: 85%;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message.assistant {
          align-self: flex-start;
        }

        .message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-warm) 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .message-content {
          padding: 14px 18px;
          border-radius: 18px;
          font-size: 15px;
          line-height: 1.5;
        }

        .message.assistant .message-content {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-bottom-left-radius: 4px;
        }

        .message.user .message-content {
          background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-warm) 100%);
          color: white;
          border-bottom-right-radius: 4px;
        }

        /* Chat Input */
        .chat-input-area {
          padding: 16px 20px 24px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-color);
        }

        .chat-input-container {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .chat-input-container input {
          flex: 1;
          padding: 14px 18px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          font-size: 15px;
          color: var(--text-primary);
          outline: none;
          transition: all 0.2s ease;
        }

        .chat-input-container input:focus {
          border-color: var(--accent-gold);
          background: white;
        }

        .chat-input-container input::placeholder {
          color: var(--text-muted);
        }

        .send-btn {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-warm) 100%);
          border: none;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .send-btn:hover {
          transform: scale(1.05);
        }

        .topic-suggestions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .topic-chip {
          padding: 8px 14px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          font-size: 13px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .topic-chip:hover {
          background: white;
          border-color: var(--accent-gold);
          color: var(--accent-gold);
        }

        /* ===== COMMUNITY VIEW ===== */
        .community-view {
          padding: 24px 20px;
        }

        .community-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .community-header h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 600;
        }

        .create-btn {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, var(--accent-sage) 0%, #6B8B67 100%);
          border: none;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
        }

        .groups-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .group-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .group-card:hover {
          box-shadow: var(--shadow-soft);
        }

        .group-avatar {
          width: 52px;
          height: 52px;
          background: var(--bg-tertiary);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
        }

        .group-info {
          flex: 1;
        }

        .group-info h4 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .group-meta {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }

        .group-active {
          font-size: 12px;
          color: var(--text-muted);
        }

        .group-arrow {
          color: var(--text-muted);
        }

        /* Prayer Wall */
        .add-prayer {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: linear-gradient(135deg, #FFE4E4 0%, #FFD4D4 100%);
          border: none;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          color: #8B6B6B;
          cursor: pointer;
        }

        .prayer-wall {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .prayer-wall-card {
          padding: 18px;
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border-color);
        }

        .prayer-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .prayer-author {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .prayer-time {
          font-size: 12px;
          color: var(--text-muted);
        }

        .prayer-request {
          font-size: 15px;
          line-height: 1.5;
          margin-bottom: 14px;
        }

        .prayer-footer {
          display: flex;
          gap: 12px;
        }

        .pray-with-btn, .encourage-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 12px;
          border: none;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pray-with-btn {
          background: linear-gradient(135deg, #FFE4E4 0%, #FFD4D4 100%);
          color: #8B6B6B;
        }

        .pray-with-btn:hover {
          background: linear-gradient(135deg, var(--accent-rose) 0%, #B08888 100%);
          color: white;
        }

        .pray-count {
          background: rgba(255,255,255,0.5);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
        }

        .encourage-btn {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        /* Events */
        .events-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .event-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border-color);
        }

        .event-date {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-warm) 100%);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .event-day {
          font-size: 22px;
          font-weight: 700;
          line-height: 1;
        }

        .event-month {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .event-info {
          flex: 1;
        }

        .event-info h4 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .event-info p {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }

        .event-time {
          font-size: 12px;
          color: var(--text-muted);
        }

        .event-join {
          padding: 10px 18px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
        }

        /* Invite Card */
        .invite-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: linear-gradient(135deg, #E8F5E8 0%, #D4EED4 100%);
          border-radius: 16px;
        }

        .invite-card svg {
          color: var(--accent-sage);
        }

        .invite-card h4 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .invite-card p {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .invite-card > div {
          flex: 1;
        }

        .invite-btn {
          padding: 12px 20px;
          background: var(--accent-sage);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        /* ===== NAV BAR ===== */
        .nav-bar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-color);
          padding: 12px 20px 24px;
          display: flex;
          justify-content: space-around;
          z-index: 100;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 16px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.2s ease;
        }

        .nav-item.active {
          color: var(--accent-gold);
        }

        .nav-item span {
          font-size: 11px;
          font-weight: 500;
        }

        .nav-item.active span {
          font-weight: 600;
        }

        /* Talk button special styling */
        .nav-item.talk-btn {
          position: relative;
          margin-top: -20px;
        }

        .nav-item.talk-btn .nav-icon-wrapper {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-warm) 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 16px rgba(196, 163, 90, 0.4);
        }
      `}</style>
      
      <div className="app-container">
        <div className="main-content">
          {renderContent()}
        </div>

        {currentView !== 'chat' && activeTab !== 'talk' && (
          <nav className="nav-bar">
            <button 
              className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <Home size={22} />
              <span>Home</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'discover' ? 'active' : ''}`}
              onClick={() => setActiveTab('discover')}
            >
              <Search size={22} />
              <span>Discover</span>
            </button>
            <button 
              className={`nav-item talk-btn ${activeTab === 'talk' ? 'active' : ''}`}
              onClick={() => { setActiveTab('talk'); setCurrentView('chat'); }}
            >
              <div className="nav-icon-wrapper">
                <MessageCircle size={24} />
              </div>
              <span>Talk</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              <Users size={22} />
              <span>Community</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <Settings size={22} />
              <span>Settings</span>
            </button>
          </nav>
        )}
      </div>
    </>
  );
}
