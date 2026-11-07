import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { initSfx } from './audio/sfx';
import { speech } from './audio/speech';
import { preloadAnimalModels } from './render/avatars/models';
import './styles.css';

// Load the clip manifest early and register the iOS audio unlock on the first tap.
speech();
initSfx();

// Hand-made avatar models are loaded before the first render so buildAnimal stays sync.
// On error or timeout the procedural animals are used.
void preloadAnimalModels().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
