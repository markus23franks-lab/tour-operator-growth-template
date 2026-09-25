import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('js/dashboard.js', 'utf8');
const html = readFileSync('Pages/dashboard.html', 'utf8');
const css = readFileSync('styles.css', 'utf8');
if (!html.includes('<body class="dashboard-pending">') || !css.includes('.dashboard-pending .main-content>section')) {
  throw new Error('Synthetic dashboard sections can appear before the entry state is resolved');
}
function run(search, researchBacked = false, invokeReady = true) {
  const nodes = new Map(); let onReady, workConstructed = 0, researchRendered = 0;
  const node = key => {
    if (!nodes.has(key)) nodes.set(key, {
      textContent: '', className: '', href: '', children: [],
      classList: { classes: new Set(['dashboard-pending']), add(value) { this.classes.add(value); }, remove(value) { this.classes.delete(value); } },
      addEventListener() {}, prepend(value) { this.children.unshift(value); }, append(...values) { this.children.push(...values); }
    });
    return nodes.get(key);
  };
  const document = {
    body: node('body'), createElement: () => node(Symbol()), getElementById: node,
    querySelector: node, addEventListener: (_, callback) => { onReady = callback; }
  };
  const context = {
    document, localStorage: { getItem: () => null }, URLSearchParams,
    window: {
      location: { search },
      GOIntelligenceEngine: class { analyze({ assessment, previewScores, previewMission }) { return { assessment, scores: previewScores, mission: previewMission, growthScore: 76, findings: [] }; } },
      GOResearchBridge: { apply: () => researchBacked ? { researchBacked: true } : null },
      GOResearchExperience: { render: () => { researchRendered++; } },
      GOWorkEngine: class { constructor() { workConstructed++; this.state = {}; } }
    }
  };
  vm.createContext(context); vm.runInContext(source, context); if (invokeReady) onReady();
  return { node, workConstructed, researchRendered };
}
const empty = run('');
if (empty.workConstructed || empty.researchRendered || !empty.node('body').classList.classes.has('dashboard-empty-mode') || empty.node('body').classList.classes.has('dashboard-pending')) throw new Error('Default dashboard did not settle into a safe empty state');
if (!empty.node('.main-content').children.some(item => item.className === 'dashboard-empty card')) throw new Error('Default dashboard has no investigation entry');
if (empty.node('sidebar-business').textContent !== 'No business loaded') throw new Error('Default dashboard leaked a sample operator');
const researched = run('', true);
if (researched.workConstructed || researched.researchRendered !== 1 || researched.node('body').classList.classes.has('dashboard-pending')) throw new Error('Research dashboard was not preserved');
const demo = run('?demo=1', false, false);
if (demo.workConstructed !== 1) throw new Error('Explicit demo mode lost its preview engine');
console.log('Dashboard entry regression passed');
