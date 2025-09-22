# Amazon Product Research Playbook

> Professional Amazon product research and analysis tools for finding, validating, and sourcing profitable FBA opportunities.

## Mission

Transform Amazon product research from guesswork into a systematic, data-driven process. Import data from Jungle Scout, Helium 10, or Amazon's Product Opportunity Explorer, score opportunities against proven criteria, validate through structured checklists, make go/no-go decisions, and generate sourcing packets—all while tracking market changes over time.

## Quickstart

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
npm run test:e2e
```

## Features

- **Data Integration**: Import from Jungle Scout, Helium 10, Amazon POE via CSV/clipboard
- **Intelligent Scoring**: 6 weighted criteria with automated recommendations  
- **Validation Checklists**: Structured workflow with progress tracking
- **Decision Framework**: Automated proceed/gather-data/reject recommendations
- **Sourcing Packets**: Print-ready documentation for suppliers
- **Market Refresh**: 7-day staleness tracking with quick update workflow
- **Comparison Tools**: Side-by-side analysis with best-in-class highlighting

## Accessibility (WCAG AA)

- ✅ Skip to content link (Tab to reveal)
- ✅ Semantic landmarks and proper heading structure
- ✅ Full keyboard navigation support
- ✅ Screen reader friendly with ARIA labels
- ✅ Respects `prefers-reduced-motion`
- ✅ AA-compliant color contrast

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build  
npm run test         # Unit tests
npm run test:e2e     # End-to-end tests
npm run lint         # Code linting
npm run format       # Code formatting
```

## CSV Data Mapping

See `samples/` directory for import examples. Supports:
- Jungle Scout exports (Revenue, Search Volume, Competition)
- Helium 10 data (ASIN, Revenue, Competition)  
- Amazon POE (Opportunity Score, Search Volume)
- Manual entry with guided forms

## Privacy & Data

- No credentials stored or transmitted
- CSV/clipboard import only - no direct API connections
- Data stored locally (localStorage) by default
- Optional Supabase integration for team sharing

## Deployment

**Vercel/Netlify**: Ensure SPA fallback redirects `/*` → `/index.html`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

---

**Built for Amazon FBA entrepreneurs who demand data-driven decisions.** 🚀