# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WritersLife is a dual-architecture application for aspiring writers consisting of:
- **Frontend**: React.js web app with Electron desktop wrapper (`writerslife-app/`)
- **Backend**: Go REST API using Gin framework (`books-api/`)

## Development Commands

### Frontend (writerslife-app/)
```bash
npm start              # Development server with Tailwind compilation
npm run build          # Production build with Tailwind
npm test              # Run Jest tests
npm run electron      # Launch Electron desktop app
npm run tailwind:css  # Compile Tailwind CSS
```

### Backend (books-api/)
```bash
make dependencies     # Install Go dependencies
make run             # Start Go server on localhost:8080
go run main.go       # Direct server execution
```

## Architecture

### Frontend Architecture
- **React Router v4** with route-based authentication using `PrivateRoute` wrapper
- **JWT authentication** stored in localStorage, expects auth service on port 8081
- **Bootstrap + Tailwind CSS** hybrid styling approach
- **Axios** for API communication with backend
- **Electron** wrapper enables cross-platform desktop deployment

### Backend Architecture
- **RESTful API** with simple MVC pattern (models in `/model/`, controllers in `main.go`)
- **In-memory data storage** - no database persistence
- **Core endpoints**: `GET /books`, `GET /book/:id`, `POST /book`
- **Gin middleware** for routing and JSON handling

### Key Components
- `src/app/Main.js` - Router configuration and authentication flow
- `src/app/PrivateRoute.js` - Authentication wrapper component
- `src/app/auth/` - Authentication components (Login, Signup, Profile, Settings)
- `books-api/main.go` - Main server with all REST endpoints
- `books-api/model/book.go` - Book data model

### Development Setup
- Frontend runs on default React dev server port
- Backend API runs on localhost:8080
- Uses foreman for concurrent development (`npm run dev`)
- Authentication expects separate auth service on port 8081

### External Links
- [Project roadmap](https://docs.google.com/document/d/1cHoFpHzs8qkmznywFxjSAxq_bX2hwrNPeigtXGboRls/edit?usp=sharing)