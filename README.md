# Still Waters

> *"He leads me beside still waters. He restores my soul."* — Psalm 23:2-3

A faith companion platform providing AI-powered pastoral support, scripture-centered guidance, and community features for spiritual growth.

## Overview

Still Waters is designed to meet people where they are emotionally and spiritually, offering:

- **AI Faith Companion** — Pastorally-sensitive conversations grounded in Scripture
- **Crisis Detection** — Three-tier safety system with professional resource integration
- **Daily Devotionals** — Curated content with reflection prompts and action steps
- **Prayer Wall & Journal** — Community intercession and private spiritual journaling
- **Bible Study Groups** — Collaborative scripture exploration
- **Topical Scripture Database** — Contextually-aware verse retrieval

## Architecture

```
still-waters/
├── api/                    # Express.js Backend
│   ├── routes/             # API endpoints
│   │   ├── auth.js         # Authentication
│   │   ├── conversations.js # AI chat (core feature)
│   │   ├── devotionals.js  # Daily content
│   │   ├── scriptures.js   # Bible search & topics
│   │   ├── prayers.js      # Prayer wall & journal
│   │   ├── groups.js       # Bible study communities
│   │   └── users.js        # Profile & preferences
│   ├── services/
│   │   └── aiService.js    # Claude integration, crisis detection
│   ├── middleware/
│   │   ├── auth.js         # JWT verification
│   │   ├── errorHandler.js # Error handling
│   │   └── logger.js       # Request logging
│   ├── utils/
│   │   ├── database.js     # DB helper functions
│   │   └── validation.js   # Input validation
│   └── server.js           # Entry point
├── database/
│   └── seeds/
│       ├── 001_scriptures_seed.sql  # Topical scripture data
│       └── 002_devotionals_seed.sql # Devotional content
├── branding/
│   ├── logo-primary.svg
│   ├── app-icon.svg
│   ├── logo-wordmark-horizontal.svg
│   ├── brand-tokens.css
│   ├── YeshuaGuideLogo.jsx
│   └── DESIGN_PHILOSOPHY.md
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express.js |
| Database | PostgreSQL via Supabase |
| AI | Claude API (Anthropic) |
| Auth | JWT + Supabase Auth |
| Frontend | React (separate repo) |

## Key Features

### AI Pastoral Companion

The core conversation engine uses Claude with carefully crafted prompts that:

- Lead with empathy before offering Scripture
- Detect mood and adjust tone appropriately
- Include relevant verses based on detected topics
- Never claim to speak as God or deliver "prophetic words"
- Recognize limits and refer to professionals when needed

### Crisis Detection System

Three-tier escalation:

| Level | Trigger | Response |
|-------|---------|----------|
| **Immediate** | Suicide keywords | Crisis resources (988), flag for review |
| **Elevated** | Hopelessness patterns | Gentle concern, professional encouragement |
| **Pastoral** | Ongoing struggles | Supportive presence, community connection |

### Scripture Database

- 40+ core passages across major topics
- Multi-version support (ESV, NIV, KJV, NASB, NLT)
- Relevance scoring for contextual retrieval
- Full-text search with PostgreSQL `tsvector`
- Apocrypha/deuterocanonical opt-in

## API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/conversations` | POST | Start new conversation |
| `/api/conversations/:id/messages` | POST | Send message, get AI response |
| `/api/devotionals/today` | GET | Get today's devotional |
| `/api/scriptures/search` | GET | Full-text Bible search |
| `/api/scriptures/topics/:id` | GET | Topic-based retrieval |
| `/api/prayers/requests` | GET/POST | Community prayer wall |
| `/api/prayers/journal` | GET/POST | Personal prayer journal |
| `/api/groups` | GET/POST | Bible study groups |

## Environment Variables

```env
# Server
PORT=3006
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# Anthropic
ANTHROPIC_API_KEY=your_claude_api_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

## Getting Started

```bash
# Clone the repository
git clone https://github.com/MSG-Headquarters/Still-Waters.git
cd Still-Waters

# Install dependencies
cd api && npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run database migrations (via Supabase dashboard)
# Then seed the database
npm run db:seed

# Start development server
npm run dev
```

## Brand Guidelines

See `/branding/DESIGN_PHILOSOPHY.md` for the complete "Sacred Geometry" design system including:

- Color palette (Parchment, Navy, Gold, Sage)
- Typography (Cormorant Garamond, Source Sans Pro)
- Logo usage guidelines
- CSS custom properties in `brand-tokens.css`

## Project Status

| Component | Status |
|-----------|--------|
| Database Schema | ✅ Complete |
| API Backend | ✅ Complete |
| AI Service | ✅ Complete |
| Scripture Seeds | ✅ Complete |
| Devotional Seeds | ✅ Complete |
| Branding | ✅ Complete |
| Frontend | 🚧 In Progress |
| Deployment | 📋 Planned |

## License

Proprietary — Main Street Group

---

*Built with faith and intention by MSG*
