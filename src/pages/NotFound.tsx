import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import PageWrapper from '../components/layout/PageWrapper';

export default function NotFound() {
  return (
    <PageWrapper>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-white">
        <h1 className="text-9xl font-display font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Página no encontrada</h2>
        <p className="text-gray-600 mb-8 max-w-md font-body">
          Lo sentimos, la página que estás buscando no existe, ha sido movida o te has equivocado al escribir la dirección.
        </p>
        <Link to="/">
          <Button>Volver al Inicio</Button>
        </Link>
      </div>
    </PageWrapper>
  );
}