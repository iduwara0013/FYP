/** Regression checks execute the actual form components with inert native hosts. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../apps/frontend');
let language = 'si';
let overrides = {};
let frame = { name: '', index: 0 };
const cache = new Map();
const callbacks = [];
const react = {
  createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
  Fragment: 'Fragment',
  useCallback: fn => fn,
  useMemo: fn => fn(),
  useEffect: () => {},
  useRef: initial => ({ current: initial }),
  useState: initial => {
    const index = frame.index++;
    const value = overrides[frame.name]?.[index];
    return [value !== undefined ? value : typeof initial === 'function' ? initial() : initial, () => {}];
  },
};
const hosts = Object.fromEntries(['Text','TextInput','View','ScrollView','TouchableOpacity','TouchableWithoutFeedback','Switch','ActivityIndicator','RefreshControl','Modal','Pressable','KeyboardAvoidingView','Image'].map(name => [name, name]));
class Value { constructor(value) { this.value = value; } interpolate() { return this.value; } }
const native = { ...hosts, StyleSheet: { create: x => x, hairlineWidth: 1, absoluteFillObject: {} }, Animated: { Value, View: 'View' }, Easing: { bezier: () => {} }, Platform: { OS: 'web' }, Alert: { alert: () => {} } };
function load(filename) {
  if (cache.has(filename)) return cache.get(filename);
  const source = fs.readFileSync(filename, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  const exports = {}; cache.set(filename, exports);
  const req = spec => {
    if (spec === 'react') return react;
    if (spec === 'react-native') return native;
    if (spec === 'react-native-safe-area-context') return { SafeAreaView: 'View' };
    if (spec === '@expo/vector-icons') return { MaterialCommunityIcons: 'Icon' };
    if (spec === 'expo-linear-gradient') return { LinearGradient: 'View' };
    if (spec.includes('ThemeContext')) return { useTheme: () => ({ isDark: false, theme: { colors: {}, shadows: {} } }) };
    if (spec === './index' || /(^|\/)i18n$/.test(spec)) return { useI18n: () => ({ language }) };
    if (spec.includes('/lib/') || spec.startsWith('expo-')) return {};
    const resolved = spec.startsWith('@/') ? path.join(root, spec.slice(2)) : path.resolve(path.dirname(filename), spec);
    const target = [resolved, resolved+'.ts', resolved+'.tsx'].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!target) throw Error('Missing module '+spec);
    return load(target);
  };
  new Function('require','exports',js)(req,exports);
  return exports;
}
function walk(node, text) {
  if (node == null || typeof node === 'boolean') return;
  if (Array.isArray(node)) { node.forEach(n => walk(n,text)); return; }
  if (typeof node !== 'object') { text.push(String(node)); return; }
  if (typeof node.type === 'function') {
    const previous = frame; frame = { name: node.type.name, index: 0 };
    const rendered = node.type(node.props); frame = previous;
    walk(rendered,text); return;
  }
  if (node.type === 'TextInput' && node.props.placeholder) text.push(node.props.placeholder);
  if (node.props.onPress) callbacks.push(node.props.onPress);
  if (node.props.action) walk(node.props.action,text);
  walk(node.props.children,text);
}
function render(file, component, props, states = {}) {
  overrides = states; callbacks.length = 0;
  const text = [];
  walk({ type: load(path.join(root,'components',file))[component], props },text);
  return text.join(' ');
}
let count=0;
function check(file, component, props, states) {
  const output=render(file,component,props,states);
  assert.match(output, /[\u0D80-\u0DFF]/, component+' must show Sinhala');
  assert.doesNotMatch(output, /[A-Za-z]/, component+' leaked English: '+output);
  count++;
}
const profile={role:'farmer',fullName:'නිමල්',email:'',id:'1',phoneNumber:'0771234567',address:'ලිපිනය',region:'Kandy',farmerType:'general',buyerType:'general',hasIrrigation:true,hasStorage:false,hasTransport:true};
const deal={id:'1',listingId:'1',farmerId:'1',buyerId:'2',farmerName:'නිමල්',buyerName:'කමල්',crop:'Tomato',listingTitle:'Tomato available',location:'මහනුවර',status:'active',listedQuantity:50,listedPrice:120,finalQuantity:50,finalPrice:120,totalAmount:6000,deliveryMethod:'Buyer pickup',deliveryDate:'2026-09-20'};
for(const role of ['farmer','buyer']){
 check('screens/ProfileViewScreen.tsx','ProfileViewScreen',{profile:{...profile,role}},{});
 check('screens/ProfileViewScreen.tsx','ProfileViewScreen',{profile:{...profile,role}},{ProfileViewScreen:{1:true}});
 check('screens/ProfileCompletionScreen.tsx','ProfileCompletionScreen',{role,initialValues:{}},{});
 check('screens/TradeHubScreen.tsx','TradeHubScreen',{profile:{...profile,role}},{TradeHubScreen:{3:false,6:role==='farmer'}});
}
for(const tab of ['discussions','completed'])check('screens/TradeHubScreen.tsx','TradeHubScreen',{profile},{TradeHubScreen:{0:tab,2:[{...deal,status:tab==='completed'?'agreed':'awaiting_confirmation'}],3:false}});
for(const status of ['active','awaiting_confirmation','agreed'])check('screens/TradeDealScreen.tsx','TradeDealScreen',{profile,initialConversation:{...deal,status}},{TradeDealScreen:{3:true}});
for(const active of [null,'calendar','alerts','finance','inventory','marketplace','best-market','disease','assistant','fields','planting','soil-inputs','offers','orders','analytics','equipment','labour'])check('screens/FarmToolkitScreen.tsx','FarmToolkitScreen',{}, {FarmToolkitScreen:{0:active}});
check('screens/YieldPredictionScreen.tsx','YieldPredictionScreen',{profile},{YieldPredictionScreen:{0:false}});
check('prediction/ResultCard.tsx','ResultCard',{result:{production_kg:1200,revenue_rs:120000,price_rs_per_kg:100,relative_supply:.8,price_source:'HARTI daily model + farm context',input:{crop:'Tomato',district:'Kandy',season:'Maha',irrigation:'Irrigated',rainfall_mm:100,fertilizer_kg:0}}},{});

for (const status of ['active','locked']) check('screens/TradeHubScreen.tsx','TradeHubScreen',{profile},{TradeHubScreen:{1:[{id:'1',crop:'Tomato',ownerName:'නිමල්',ownerId:'1',location:'Kandy',quantity:20,price:50,status}],3:false}});
check('screens/FarmToolkitScreen.tsx','FarmToolkitScreen',{}, {FarmToolkitScreen:{1:[{id:'1',kind:'calendar',title:'Water and inspect Tomato',detail:'Automatically created from crop-cycle record',status:'queued'}]}});
check('screens/FarmToolkitScreen.tsx','FarmToolkitScreen',{}, {FarmToolkitScreen:{0:'best-market'},ToolBody:{7:[{crop:'Tomato',price:'Rs. 200/kg'}]}});
check('screens/FarmToolkitScreen.tsx','FarmToolkitScreen',{}, {FarmToolkitScreen:{0:'disease'},ToolBody:{6:'Possible nutrient stress or viral symptoms. Isolate affected plants and request an officer inspection.'}});

const backend=fs.readFileSync(path.resolve(__dirname,'../apps/Backend/python_backend/src/services/prediction_service.py'),'utf8');
const options=[...backend.matchAll(/^(?:CROPS|DISTRICTS|SEASONS|REGIONS|IRRIGATION) = \[([^\]]+)\]/gm)].flatMap(m=>[...m[1].matchAll(/"([^"]+)"/g)].map(x=>x[1]));
const {useFormI18n}=load(path.join(root,'i18n/useFormI18n.ts'));
for(const option of options){
 assert.doesNotMatch(useFormI18n().tx(option),/[A-Za-z]/,'Untranslated backend option '+option);
 let selected;
 check('prediction/Selectors.tsx','ChipSelector',{options:[option],value:option,onChange:value=>{selected=value;}},{});
 callbacks[0](); assert.equal(selected,option,'Selector must submit the canonical value');
}
const si=useFormI18n();assert.equal(si.tx('With {name}',{name:'Alice'}),'Alice සමඟ');
assert.doesNotMatch(si.errorText(new Error('Internal server error'),'Please try again.'),/[A-Za-z]/);
language='en';const en=useFormI18n();
assert.equal(en.tx('With {name}',{name:'Alice'}),'With Alice');
assert.equal(en.tx('Unchanged user text'),'Unchanged user text');
assert.equal(en.errorText(new Error('Network failed'),'Please try again.'),'Network failed');
assert.match(render('screens/ProfileViewScreen.tsx','ProfileViewScreen',{profile},{}),/My profile/);
console.log(`Passed ${count} Sinhala component scenarios, ${options.length} canonical option checks, language switching, interpolation and error localization.`);
