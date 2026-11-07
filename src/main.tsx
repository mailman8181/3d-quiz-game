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

// Hand-made avatar models load in the background; avatars built before they arrive swap
// themselves in place (see render/avatars/models.ts). The first screen never waits.
void preloadAnimalModels();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
