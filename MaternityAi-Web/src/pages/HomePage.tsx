import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Headers/HeaderHome/Header';
import { Content } from '../components/info/contenthome/Content';

export const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hasLoggedInBefore = localStorage.getItem('has_logged_in_before');
    if (hasLoggedInBefore === 'true') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <>
      <Header />
      <Content />
    </>
  );
};
