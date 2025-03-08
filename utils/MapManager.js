import { YaMaps } from 'react-native-yamap';
import { YANDEX_API_KEY } from '../config/keys';

export const initializeYandexMap = async () => {
  try {
    if (YaMaps) {
      await YaMaps.init(YANDEX_API_KEY);
      console.log('Yandex Maps initialized successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to initialize Yandex Maps:', error);
    return false;
  }
};
