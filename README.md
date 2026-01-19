# Essay Grader Pro

**AI-Powered Essay Assessment Tool for Educators**

> ### 🚀 [One-Click Install Guide for Educators](https://bbuxton0823.github.io/Essay-Grader-Pro/INSTALL.html)
> **New to Essay Grader Pro?** Follow our 2-minute visual install guide - no tech experience needed!

A comprehensive suite of tools designed for K-12 teachers to grade student essays using AI-powered analysis with i-Ready Reading & Writing Assessment standards. Includes both a standalone web application and a browser extension for Schoology/Google Classroom integration.

![Version](https://img.shields.io/badge/Version-2.0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Chrome%20Extension-blue)

---

## What's Included

| Component | Description | Use Case |
|-----------|-------------|----------|
| **Web Application** | Standalone HTML file for essay grading | Batch grading, detailed analysis, student tracking |
| **Browser Extension** | Chrome extension for LMS integration | Grade directly within Schoology or Google Classroom |

---

## Quick Start

### Option 1: Web Application

1. Download or clone this repository
2. Open `index.html` in your browser
3. Enter your API key (Anthropic or OpenAI)
4. Start grading essays

### Option 2: Browser Extension (Schoology & Google Classroom)

1. Download the `extension/` folder
2. Open Chrome → `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" → select the `extension/` folder
5. Configure your API key via the extension popup
6. Navigate to Schoology or Google Classroom and press `Ctrl+Shift+G`

See [Extension Installation Guide](extension/INSTALL.md) for detailed instructions.

---

## Features

### Core Grading Capabilities
- **Grammar Analysis** - Comprehensive evaluation of sentence structure, punctuation, and grammatical correctness
- **Spelling Assessment** - Identifies misspellings with suggested corrections
- **Originality Scoring** - Evaluates creative expression and authentic voice
- **AI Detection** - Flags potential AI-generated content with confidence levels and suspicious excerpts
- **i-Ready Grade Level Detection** - Auto-detects student writing level (grades 6-12)

### Skill Gap Analysis (NEW in v2.0)
- **Detailed Skill Identification** - Pinpoints specific weaknesses in grammar, mechanics, organization, development, and vocabulary
- **Priority Ranking** - Identifies top 3 skills each student needs to work on
- **On-Demand Practice Generation** - Create personalized practice worksheets targeting individual skill gaps

### LMS Integration (NEW in v2.0)
- **Schoology Support** - Extract essays directly from submission pages
- **Google Classroom Support** - Works with Classroom's grading interface
- **ZIP File Processing** - Import Schoology bulk downloads directly
- **Schoology CSV Export** - Export grades in Schoology-compatible format

### Teacher Tools
- **Customizable Preferences** - Adjust weights, penalties, and passing thresholds
- **Preset Configurations** - Quick presets for Strict, Lenient, Grammar-Focus, and more
- **AP Style Checking** - Optional Associated Press style guide compliance
- **Redlined Markup** - Visual essay markup with teacher editing capabilities
- **Batch Grading** - Process multiple essays with drag-and-drop or ZIP upload
- **Student Progress Tracking** - Monitor improvement over time with trend analysis

---

## Privacy & Security

This tool was built with educator privacy as a top priority:

| Feature | Implementation |
|---------|----------------|
| **Local Processing** | All data stays in your browser |
| **Direct API Calls** | Essays sent only to Claude/OpenAI, nowhere else |
| **No Server** | Zero backend, zero data collection |
| **No Analytics** | No tracking, no telemetry |
| **Extension Privacy** | Developer mode install - invisible to IT |
| **Minimal Permissions** | Extension only requests `activeTab` and `storage` |

Your API key is stored in your browser's local storage and is never transmitted except directly to your chosen AI provider.

---

## Web Application Usage

### Single Essay Grading
1. Enter the student's name
2. Paste essay text or upload a file (.txt, .docx, .pdf)
3. Toggle AP Style checking if needed
4. Click "Grade Essay"
5. Review detailed feedback, skill gaps, and redlined markup

### Batch Grading
1. Switch to "Batch Grading" tab
2. Drag and drop essay files OR upload a Schoology ZIP
3. Click "Start Grading"
4. Review individual results with skill gap analysis
5. Click "Generate Practice" for students who need extra help
6. Export grades to Schoology CSV format

### Student Progress
1. Switch to "Student Progress" tab
2. View all tracked students and their scores
3. Click a student to see detailed history and trends
4. Export data as CSV or JSON for gradebook integration

---

## Browser Extension Usage

### On Schoology
1. Navigate to a student's essay submission
2. Press `Ctrl+Shift+G` (or `Cmd+Shift+G` on Mac)
3. The grading sidebar opens
4. Click "Extract from Page" to pull the essay text
5. Click "Grade Essay"
6. Copy the grade and enter it manually in Schoology

### On Google Classroom
1. Open a student's submission
2. Press `Ctrl+Shift+G` (or `Cmd+Shift+G` on Mac)
3. Click "Extract from Page" or paste text manually
4. Click "Grade Essay"
5. Copy the grade and enter it in Classroom

### Generate Practice Worksheets
1. After grading, click "Generate Practice"
2. A personalized HTML worksheet downloads automatically
3. Print or share with the student

---

## File Naming Conventions

Teachers can select from multiple naming patterns in Teacher Preferences:

| Pattern | Example | Best For |
|---------|---------|----------|
| FirstName_LastName_Assignment | `John_Smith_NarrativeEssay.docx` | Default, most common |
| LastName_FirstName_Assignment | `Smith_John_NarrativeEssay.docx` | Alphabetical gradebooks |
| StudentID_Assignment | `12345_NarrativeEssay.docx` | Privacy-focused districts |
| LastName_Assignment | `Smith_NarrativeEssay.docx` | Simplified naming |
| FirstName_LastName | `John_Smith.docx` | Name-only identification |
| Any Underscore-Separated | `Any_Format_Works.docx` | Maximum flexibility |

---

## Supported File Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| Plain Text | .txt | Direct text import |
| Word Document | .docx | Full text extraction |
| PDF | .pdf | Text extraction (not scanned images) |
| ZIP Archive | .zip | Schoology bulk download support |

---

## i-Ready Assessment Integration

The application uses i-Ready Reading & Writing Assessment benchmarks to automatically detect student writing levels:

| Grade | Key Indicators |
|-------|----------------|
| 6th | Simple sentences, basic transitions, ~12K word vocabulary |
| 7th | Mixed sentence types, varied transitions, developing academic voice |
| 8th | Complex sentences, sophisticated transitions, academic vocabulary |
| 9-10th | Varied syntax for rhetorical effect, nuanced transitions |
| 11-12th | Sophisticated syntax variety, seamless transitions, advanced vocabulary |

---

## API Requirements

You'll need an API key from one of these providers:

### Anthropic (Claude) - Recommended
1. Go to https://console.anthropic.com/
2. Create an account and add credits
3. Generate an API key (starts with `sk-ant-`)

### OpenAI (GPT-4)
1. Go to https://platform.openai.com/
2. Create an account and add credits
3. Generate an API key (starts with `sk-`)

**Typical cost:** $0.01-0.05 per essay graded

---

## Version History

### Version 2.0 (Current)
- Schoology & Google Classroom browser extension
- ZIP file support for bulk downloads
- Detailed skill gap analysis with 5 categories
- On-demand practice worksheet generation
- Schoology-compatible CSV export
- Priority skill ranking for targeted remediation

### Version 1.0
- Core essay grading (grammar, spelling, originality)
- AI detection system
- AP Style integration
- Redlined markup
- Batch grading
- Student progress tracking
- i-Ready assessment benchmarks
- Customizable naming patterns

---

## Browser Compatibility

| Browser | Web App | Extension |
|---------|---------|-----------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ❌ (Chrome only) |
| Safari | ✅ | ❌ (Chrome only) |
| Edge | ✅ | ✅ (Chromium-based) |

---

## Project Structure

```
Essay-Grader-Pro/
├── index.html              # Main web application
├── extension/              # Browser extension
│   ├── manifest.json
│   ├── background.js
│   ├── content-scripts/
│   │   ├── schoology.js
│   │   ├── classroom.js
│   │   └── styles.css
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.js
│   ├── sidebar/
│   │   ├── sidebar.html
│   │   └── sidebar.js
│   ├── icons/
│   └── INSTALL.md
├── LICENSE
└── README.md
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude AI
- [OpenAI](https://openai.com/) for GPT models
- [i-Ready](https://www.curriculumassociates.com/products/i-ready) for assessment framework inspiration
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) for DOCX parsing
- [pdf.js](https://mozilla.github.io/pdf.js/) for PDF parsing
- [JSZip](https://stuk.github.io/jszip/) for ZIP file processing

---

## Support

For questions or issues, please open a GitHub issue.

---

*Built for educators who value privacy, efficiency, and individualized student support.*
