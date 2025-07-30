# 🖥️ Windows 95 Portfolio

A nostalgic, interactive portfolio website built to look and feel like Windows 95, complete with authentic UI elements, classic games, and retro aesthetics.

![Windows 95 Portfolio](https://img.shields.io/badge/Windows-95-00A4EF?style=for-the-badge&logo=windows&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14.2.16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🎮 Live Demo

[**Experience the Windows 95 Portfolio**](https://win95-portfolio-rh5ub63fc-jguapps-projects.vercel.app/)

## ✨ Features

### 🖥️ Authentic Windows 95 Experience
- **Boot Sequence**: Realistic Windows 95 startup with authentic boot sound
- **Desktop Interface**: Classic desktop with draggable icons and context menus
- **Taskbar**: Functional taskbar with start menu and system tray
- **Window Management**: Minimize, maximize, and close windows just like the real thing
- **Screen Saver**: Configurable screen saver with classic options (Mystify, Starfield)

### 🎯 Portfolio Sections
- **About Me**: Personal information and background
- **Resume**: Professional experience and skills
- **Projects**: Showcase of development work
- **Contact**: Contact form with email functionality
- **Gallery**: Photo gallery with professional images
- **Paint**: Functional MS Paint clone with drawing tools

### 🎮 Classic Games
- **Chess**: Full-featured chess game with piece movement
- **Minesweeper**: Classic minesweeper with multiple difficulty levels
- **Pong**: Retro pong game with paddle controls
- **Solitaire**: Windows Solitaire card game
- **Tetris**: Classic tetris with falling blocks
- **Pokemon Battle**: Hidden Pokemon battle game (Konami code: ↑↑↓↓←→←→BA)

### 🎨 Customization
- **Desktop Backgrounds**: Multiple classic Windows 95 backgrounds
- **Color Schemes**: Different Windows 95 color themes
- **Icon Arrangement**: Auto-arrange, line up, or manual positioning
- **Context Menus**: Right-click menus with classic options

### 🔧 Technical Features
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: Classic Windows shortcuts
- **Local Storage**: Saves user preferences and settings
- **Sound Effects**: Authentic Windows 95 sounds
- **Blue Screen of Death**: Easter egg BSOD simulation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/windows95-portfolio.git
   cd windows95-portfolio
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

## 🎮 How to Use

### Basic Navigation
- **Click icons** to open applications
- **Right-click** for context menus
- **Drag icons** to reposition them
- **Use the Start menu** to access programs

### Games
- **Chess**: Click and drag pieces to move them
- **Minesweeper**: Left-click to reveal, right-click to flag
- **Pong**: Use arrow keys or mouse to control paddles
- **Solitaire**: Drag cards to build sequences
- **Tetris**: Use arrow keys to rotate and move blocks

### Hidden Features
- **Konami Code**: Press ↑↑↓↓←→←→BA to trigger Pokemon battle
- **Screen Saver**: Configure in Display Properties
- **Blue Screen**: Available in system menu (easter egg)

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Windows 95 styles
- **UI Components**: Radix UI primitives
- **State Management**: React hooks and context
- **Icons**: Lucide React + custom Windows 95 icons
- **Audio**: HTML5 Audio API
- **Storage**: Local Storage for persistence

## 📁 Project Structure

```
windows95-portfolio/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── desktop.tsx        # Desktop interface
│   ├── taskbar.tsx        # Taskbar component
│   ├── window.tsx         # Window wrapper
│   ├── games/            # Game components
│   └── window-content/   # Window content components
├── public/               # Static assets
│   ├── images/          # Images and icons
│   └── fonts/           # Custom fonts
├── lib/                 # Utility functions
└── hooks/               # Custom React hooks
```

## 🎨 Customization

### Adding New Desktop Icons
Edit `components/desktop.tsx` and add to the `DEFAULT_ICONS` array:

```typescript
{
  id: "your-app",
  label: "Your App",
  icon: "/images/desktop-icons/your-icon.png",
  type: "application",
}
```

### Creating New Windows
1. Create a new component in `components/window-content/`
2. Add it to the window rendering logic in `app/page.tsx`
3. Add corresponding desktop icon

### Adding New Games
1. Create game component in `components/window-content/games/`
2. Add to the games menu in `components/arcade-menu.tsx`
3. Update routing logic

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Windows 95 Design**: Inspired by Microsoft's classic operating system
- **Icons**: Custom Windows 95-style icons
- **Sounds**: Authentic Windows 95 audio clips
- **Games**: Classic implementations of retro games
- **Community**: Thanks to all contributors and supporters

## 📞 Contact

- **Portfolio**: [Your Portfolio URL]
- **Email**: [your.email@example.com]
- **LinkedIn**: [Your LinkedIn]
- **GitHub**: [Your GitHub]

---

*Made with ❤️ and nostalgia for the golden age of computing*

<div align="center">
  <img src="https://img.shields.io/badge/Windows-95-00A4EF?style=for-the-badge&logo=windows&logoColor=white" alt="Windows 95">
  <img src="https://img.shields.io/badge/Next.js-14.2.16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React">
</div>
