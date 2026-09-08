import { BackgroundDecor } from '../components/backgrounds/Backgrounddecor';
import { HeaderActividad } from '../components/Headers/HeaderActividad/HeaderActividad';
import { ContentBiblioteca } from '../components/info/contentbiblioteca/ContentBiblioteca';

export const Biblioteca = () => {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <BackgroundDecor />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeaderActividad />
        <ContentBiblioteca />
      </div>
    </div>
  );
};
