# Dev Workflow Website

A modern, responsive website for the Dev Workflow MCP Server built with Next.js, React, and Tailwind CSS.

## Features

- ✅ **Responsive Design** - Optimized for all screen sizes including vertical/portrait monitors
- 🌓 **Dark/Light Mode Toggle** - User preference persisted to localStorage with system preference detection
- 📱 **Mobile First** - Fully responsive with adaptive layouts for sm, md, lg, and xl breakpoints
- ⚡ **Static Export** - Pre-rendered static HTML for fast Netlify deployment
- 🎨 **Modern UI** - Built with Tailwind CSS and Lucide React icons
- ♿ **Accessible** - Semantic HTML and proper ARIA labels

## Getting Started

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

### Build

```bash
npm run build
```

Generates static HTML in the `out/` directory.

## Features Overview

### Responsive Vertical Monitor Support
- Grid layout switches from 2-column to single-column on smaller screens
- Terminal visualization hidden on screens smaller than xl breakpoint
- Responsive padding and text sizes scale appropriately

### Dark/Light Mode
- Toggle button in navbar (Sun/Moon icons)
- Theme preference stored in localStorage
- Respects system color scheme preference on first visit
- Smooth transitions between modes

## Deployment

### Netlify

1. **Prerequisites**: Install Netlify CLI
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the site**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=out
   ```

4. **Or connect GitHub for automatic deployments**
   - Push to GitHub
   - Connect repo to Netlify
   - Netlify automatically builds and deploys on push

### Environment Setup

Create a `.env.local` file if needed for environment variables (currently not required).

## Testing

Run the build verification tests:

```bash
node verify-build.js
```

Tests verify:
- Build completes successfully
- All pages generate correctly
- Dark mode classes are included
- Responsive design classes present
- Theme toggle functionality
- Viewport meta tags for mobile
- Vertical monitor optimization

## Project Structure

```
web/
├── app/
│   ├── layout.tsx          # Root layout with ThemeProvider
│   ├── page.tsx            # Homepage
│   ├── globals.css         # Global styles
│   └── docs/               # Documentation pages
├── components/
│   ├── Navbar.tsx          # Navigation with theme toggle
│   ├── Hero.tsx            # Hero section
│   ├── Features.tsx        # Features grid
│   ├── History.tsx         # Workflow history section
│   ├── Terminal.tsx        # Animated terminal demo
│   ├── Footer.tsx          # Footer
│   └── ThemeProvider.tsx   # Theme context provider
├── public/                 # Static assets
├── tailwind.config.ts      # Tailwind configuration
├── next.config.ts          # Next.js configuration
└── package.json
```

## Technologies

- **Framework**: Next.js 16 with Turbopack
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React
- **Language**: TypeScript
- **Deployment**: Netlify (static export)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Static HTML export for instant page loads
- Optimized images with Next.js Image component
- Minimal JavaScript bundle
- CSS-in-JS with Tailwind for efficient styling
