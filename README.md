# SC2 Replay Analyzer

A comprehensive StarCraft II replay analysis tool built with the T3 Stack that processes replay files locally using Python scripts and provides detailed insights into gameplay, player statistics, and build orders.

## Features

- **Replay File Processing**: Analyze 110+ existing SC2 replay files from professional matches
- **Player Statistics**: Extract APM, resource collection, units killed, and army values
- **Build Order Analysis**: Capture and display the first 15 meaningful build actions with timestamps
- **Database Caching**: Store analysis results to avoid reprocessing replays
- **Modern UI**: Clean, responsive interface with side-by-side player comparisons
- **Real-time Processing**: Show analysis progress with loading indicators
- **Error Handling**: Comprehensive error handling for corrupted files and processing failures

## Tech Stack

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: T3 Stack with Drizzle ORM and SQLite database  
- **Authentication**: NextAuth.js (configured but optional for replay analysis)
- **Replay Parsing**: Python with sc2reader library
- **UI Components**: Shadcn/ui component library

## Project Structure

```
├── python/
│   ├── analyze_replay.py       # Main replay analysis script
│   ├── validate_environment.py # Environment validation
│   └── requirements.txt        # Python dependencies
├── replays/                    # SC2 replay files directory
├── src/
│   ├── app/replays/           # Replay analyzer pages and components
│   ├── server/db/             # Database schema and configuration
│   └── components/ui/         # Reusable UI components
└── drizzle/                   # Database migrations
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies globally
pip install --break-system-packages sc2reader
```

### 2. Environment Setup

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Set your database URL and auth secrets as needed.

### 3. Database Setup

```bash
# Generate and apply database migrations
npm run db:generate
npm run db:push
```

### 4. Validate Python Environment

```bash
python3 python/validate_environment.py
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/replays` to start analyzing replays.

## Usage

1. Navigate to `/replays` page
2. Select a replay file from the dropdown (110+ available)
3. Click "Analyze Replay" button
4. View detailed results including:
   - Game information (map, duration, version)
   - Player statistics (APM, resources, units killed)
   - Build order timeline for each player
   - Win/loss results

Results are automatically cached in the database for faster subsequent access.

## Database Schema

The application uses four main tables:
- `replays`: Game metadata and information
- `players`: Player information (name, race)  
- `replay_players`: Junction table linking players to replays with statistics
- `build_orders`: Build order sequences for each player

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript checking
- `npm run lint` - Run ESLint
- `npm run db:studio` - Open Drizzle Studio for database management

## Python Scripts

- `python/analyze_replay.py <file>` - Analyze single replay file
- `python/validate_environment.py` - Check Python dependencies

## Contributing

This project follows standard Next.js and T3 Stack conventions. All replay analysis happens locally - no external APIs required.

## Built With T3 Stack

This project was bootstrapped with [create-t3-app](https://create.t3.gg/) and includes:
- [Next.js](https://nextjs.org) - React framework
- [Drizzle](https://orm.drizzle.team) - TypeScript ORM  
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [NextAuth.js](https://next-auth.js.org) - Authentication
