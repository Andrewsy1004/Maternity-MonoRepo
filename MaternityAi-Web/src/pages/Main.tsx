import { BackgroundDecor } from '../components/backgrounds/Backgrounddecor';
import { HeaderActividad } from '../components/Headers/HeaderActividad/HeaderActividad';
import { ContentMain } from '../components/info/contentMain/ContentMain';
import { ConsentModal, useConsentCheck } from '../components/consent/ConsentModal';

export const Main = () => {
  const { consentStatus, markAccepted } = useConsentCheck();

  return (
    <div>
      <BackgroundDecor />
      <HeaderActividad />
      <ContentMain />
      {consentStatus === 'pending' && (
        <ConsentModal onAccepted={markAccepted} />
      )}
    </div>
  );
};
