import { BackgroundDecor } from '../components/backgrounds/Backgrounddecor';
import { HeaderActividad } from '../components/Headers/HeaderActividad/HeaderActividad';
import { ContentAct } from '../components/info/contentAct/Actividad/ContentAct';

export const Actividad = () => {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <BackgroundDecor />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeaderActividad />
        <ContentAct />
      </div>  
    </div>
  );
};
