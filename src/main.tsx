import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { iniciarPerfilRemoto } from './data/perfilRemoto';
import './styles/index.css';

const raiz = ReactDOM.createRoot(document.getElementById('root')!);

// La app se monta UNA sola vez. Cuando después cambian los datos (API tardía, vista previa del panel),
// cada sección avisa su cambio (src/data/almacen.ts) y React vuelve a pintar sin desmontar nada.
iniciarPerfilRemoto().finally(() =>
  raiz.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  ),
);
