# Project Submission Answers
 
---
 
## 1. How to Run This Project Locally
 
```bash
git clone https://github.com/VarshaVardhiniM/promodoro-timer.git
cd promodoro-timer
npm install
npm start
```
 
The app will run on `http://localhost:3000`.
 
You can also directly use the live deployed version:
[https://promodoro-timer-seven.vercel.app/](https://promodoro-timer-seven.vercel.app/)
 
---
 
## 2. Stack & Design Choices
 
### Tech Stack Used
 
- **React.js** — frontend framework
- **JavaScript** — logic and timer handling
- **HTML** — structure
- **CSS** — styling
- **Vercel** — deployment
- **GitHub** — version control
### Design Choices
 
- Minimal UI to avoid distraction during focus sessions
- Simple layout with a central timer for clarity
- Large, readable timer display for usability
- Separate buttons for Start, Pause, and Reset for better control
- Light design approach to keep the interface clean and productivity-focused
---
 
## 3. Responsive & Accessibility Decisions
 
### Responsiveness
 
- Used flexible layouts (CSS Flexbox) for different screen sizes
- Timer and buttons scale properly on mobile and desktop
- Avoided fixed pixel layouts to ensure adaptability
### Accessibility
 
- Clear button labels (Start, Pause, Reset)
- High contrast between text and background for readability
- Simple UI structure for easy navigation
- Keyboard-friendly interaction (buttons usable without mouse)
---
 
## 4. AI Usage
 
AI tools were used in the following ways:
 
- To get guidance on structuring the Pomodoro Timer logic
- To understand best practices for React state management
- To help improve UI structure and component organization
- To generate deployment and README formatting suggestions
> All implementation, debugging, and customization of the project were done manually.
 
---
 
## 5. Honest Gaps / Limitations
 
- No backend integration (data is not stored permanently)
- No user authentication or profiles
- No analytics dashboard for tracking productivity
- No sound notifications or advanced alerts
- Basic UI without advanced animations or gamification features
- Timer accuracy depends on browser performance (`setInterval` limitations)
These are planned improvements for future versions.
