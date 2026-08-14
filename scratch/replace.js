const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'chat', 'ChatView.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const target1 = `const HERO_LOTTIE_SRC = "https://lottie.host/a7719fd3-75b2-40a4-92bf-1393879984f6/s6oIomjnI3.lottie";\r\n\r\ninterface ChatViewProps {`;
const replace1 = `const HERO_LOTTIE_SRC = "https://lottie.host/a7719fd3-75b2-40a4-92bf-1393879984f6/s6oIomjnI3.lottie";

const THINKING_PHRASES = [
  "Calculating...",
  "Digesting...",
  "Performing...",
  "Synchronizing...",
  "Synthesizing...",
  "Reviewing...",
  "Working...",
  "Researching...",
  "Vibing...",
  "Computing...",
  "Analyzing...",
  "Sketching..."
];

function ThinkingLabel() {
  const [phrase, setPhrase] = useState(THINKING_PHRASES[0]);

  useEffect(() => {
    let interval = setInterval(() => {
      setPhrase(THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return <span className="text-[10px] md:text-xs text-zinc-400 ml-1">{phrase}</span>;
}

interface ChatViewProps {`;

const target1_linux = `const HERO_LOTTIE_SRC = "https://lottie.host/a7719fd3-75b2-40a4-92bf-1393879984f6/s6oIomjnI3.lottie";\n\ninterface ChatViewProps {`;

if (content.includes(target1)) {
    content = content.replace(target1, replace1);
} else if (content.includes(target1_linux)) {
    content = content.replace(target1_linux, replace1);
} else {
    console.log("Could not find target 1");
    process.exit(1);
}

const target2 = `<span className="text-[10px] md:text-xs text-zinc-400 ml-1">Thinking...</span>`;
const replace2 = `<ThinkingLabel />`;

if (content.includes(target2)) {
    content = content.replace(target2, replace2);
} else {
    console.log("Could not find target 2");
    process.exit(1);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Success");
