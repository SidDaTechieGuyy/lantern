
import Homepage from './components/Homepage';
import GlobalContextsProvider from './components/plasmic/lantern/PlasmicGlobalContextsProvider'

function App() {
  return (<GlobalContextsProvider><Homepage /></GlobalContextsProvider>);
}

export default App;
  