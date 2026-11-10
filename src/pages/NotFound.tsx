import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import PageWrapper from '../components/layout/PageWrapper';
import Ilustracion404 from '../components/ui/Ilustracion404Grifo';

export default function NotFound() {
  return (
    <PageWrapper>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-10 bg-white">
        <Ilustracion404 />
        <h1 className="mt-6 text-3xl md:text-4xl font-display font-bold text-primary">Página no encontrada</h1>
        <div className="mx-auto mt-3 mb-5 h-1 w-16 rounded bg-gold" aria-hidden="true" />
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
