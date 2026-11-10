import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { iniciarPerfilRemoto } from './data/perfilRemoto';
import './styles/index.css';

const raiz = ReactDOM.createRoot(document.getElementById('root')!);
let version = 0;

const montar = () =>
  raiz.render(
    <React.StrictMode>
      <App key={version} />
    </React.StrictMode>,
  );

// Cuando cambian los datos (API tardía, vista previa del panel) se vuelve a montar la app
// conservando la posición de scroll.
const alCambiar = () => {
  const y = window.scrollY;
  version += 1;
  montar();
  for (const ms of [0, 80, 250]) setTimeout(() => window.scrollTo(0, y), ms);
};

iniciarPerfilRemoto(alCambiar).finally(montar);
