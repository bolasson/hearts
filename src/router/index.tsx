import { Routes, Route, useLocation, type Location } from 'react-router-dom';
import { GamePage } from '@/pages/GamePage';
import { HomePage } from '@/pages/HomePage';
import { SettingsPage } from '@/pages/SettingsPage';

type RouterLocationState = {
  backgroundLocation?: Location;
};

export function AppRouter() {
  const location = useLocation();
  const state = location.state as RouterLocationState | null;
  const backgroundLocation = state?.backgroundLocation;

  return (
    <>
      <Routes location={backgroundLocation ?? location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/settings" element={<HomePage />} />
      </Routes>
      {backgroundLocation && (
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      )}
    </>
  );
}
