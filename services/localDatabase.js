import AsyncStorage from '@react-native-async-storage/async-storage';

// Database keys
const DB_KEYS = {
  USER_PROFILE: 'user_profile',
  DRIVER_PROFILE: 'driver_profile',
  PASSENGER_PROFILE: 'passenger_profile',
  TRIP_HISTORY: 'trip_history',
  FAVORITE_DESTINATIONS: 'favorite_destinations',
  DRIVER_DATA: 'driver_data',
  RIDE_REQUESTS: 'ride_requests',
  PAYMENT_METHODS: 'payment_methods',
  APP_SETTINGS: 'app_settings',
  SEARCH_HISTORY: 'search_history',
  ROUTES_CACHE: 'routes_cache',
  NOTIFICATIONS: 'notifications'
};

class LocalDatabase {
  // User Profile Management
  async saveUserProfile(profile) {
    try {
      await AsyncStorage.setItem(DB_KEYS.USER_PROFILE, JSON.stringify(profile));
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      return false;
    }
  }

  async getUserProfile() {
    try {
      const profile = await AsyncStorage.getItem(DB_KEYS.USER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async updateUserProfile(updates) {
    try {
      const currentProfile = await this.getUserProfile() || {};
      const updatedProfile = { ...currentProfile, ...updates };
      await AsyncStorage.setItem(DB_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // Driver Profile Management
  async saveDriverProfile(profile) {
    try {
      await AsyncStorage.setItem(DB_KEYS.DRIVER_PROFILE, JSON.stringify(profile));
      return true;
    } catch (error) {
      console.error('Error saving driver profile:', error);
      return false;
    }
  }

  async getDriverProfile() {
    try {
      const profile = await AsyncStorage.getItem(DB_KEYS.DRIVER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting driver profile:', error);
      return null;
    }
  }

  async updateDriverProfile(updates) {
    try {
      const currentProfile = await this.getDriverProfile() || {};
      const updatedProfile = { ...currentProfile, ...updates };
      await AsyncStorage.setItem(DB_KEYS.DRIVER_PROFILE, JSON.stringify(updatedProfile));
      return true;
    } catch (error) {
      console.error('Error updating driver profile:', error);
      return false;
    }
  }

  // Driver Status Management
  async setDriverOnlineStatus(isOnline) {
    try {
      return await this.updateDriverProfile({ 
        isOnline, 
        lastStatusChange: new Date().toISOString() 
      });
    } catch (error) {
      console.error('Error setting driver online status:', error);
      return false;
    }
  }

  async getDriverOnlineStatus() {
    try {
      const profile = await this.getDriverProfile();
      return profile ? profile.isOnline || false : false;
    } catch (error) {
      console.error('Error getting driver online status:', error);
      return false;
    }
  }

  // Trip History Management
  async saveTrip(trip) {
    try {
      const trips = await this.getTripHistory();
      const newTrip = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...trip
      };
      trips.unshift(newTrip);
      
      // Keep only last 50 trips
      const limitedTrips = trips.slice(0, 50);
      await AsyncStorage.setItem(DB_KEYS.TRIP_HISTORY, JSON.stringify(limitedTrips));
      return newTrip.id;
    } catch (error) {
      console.error('Error saving trip:', error);
      return null;
    }
  }

  async getTripHistory() {
    try {
      const trips = await AsyncStorage.getItem(DB_KEYS.TRIP_HISTORY);
      return trips ? JSON.parse(trips) : [];
    } catch (error) {
      console.error('Error getting trip history:', error);
      return [];
    }
  }

  async deleteTrip(tripId) {
    try {
      const trips = await this.getTripHistory();
      const filteredTrips = trips.filter(trip => trip.id !== tripId);
      await AsyncStorage.setItem(DB_KEYS.TRIP_HISTORY, JSON.stringify(filteredTrips));
      return true;
    } catch (error) {
      console.error('Error deleting trip:', error);
      return false;
    }
  }

  // Favorite Destinations Management
  async saveFavoriteDestination(destination) {
    try {
      const favorites = await this.getFavoriteDestinations();
      const newFavorite = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...destination
      };
      
      // Check if already exists
      const exists = favorites.find(fav => 
        fav.lat === destination.lat && fav.lng === destination.lng
      );
      
      if (!exists) {
        favorites.unshift(newFavorite);
        await AsyncStorage.setItem(DB_KEYS.FAVORITE_DESTINATIONS, JSON.stringify(favorites));
      }
      return newFavorite.id;
    } catch (error) {
      console.error('Error saving favorite destination:', error);
      return null;
    }
  }

  async getFavoriteDestinations() {
    try {
      const favorites = await AsyncStorage.getItem(DB_KEYS.FAVORITE_DESTINATIONS);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error getting favorite destinations:', error);
      return [];
    }
  }

  async removeFavoriteDestination(destinationId) {
    try {
      const favorites = await this.getFavoriteDestinations();
      const filteredFavorites = favorites.filter(fav => fav.id !== destinationId);
      await AsyncStorage.setItem(DB_KEYS.FAVORITE_DESTINATIONS, JSON.stringify(filteredFavorites));
      return true;
    } catch (error) {
      console.error('Error removing favorite destination:', error);
      return false;
    }
  }

  // Driver Data Management (Simulated)
  async saveDriverData(driver) {
    try {
      const drivers = await this.getDriverData();
      const newDriver = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'available',
        ...driver
      };
      drivers.push(newDriver);
      await AsyncStorage.setItem(DB_KEYS.DRIVER_DATA, JSON.stringify(drivers));
      return newDriver.id;
    } catch (error) {
      console.error('Error saving driver data:', error);
      return null;
    }
  }

  async getDriverData() {
    try {
      const drivers = await AsyncStorage.getItem(DB_KEYS.DRIVER_DATA);
      return drivers ? JSON.parse(drivers) : [];
    } catch (error) {
      console.error('Error getting driver data:', error);
      return [];
    }
  }

  async updateDriverStatus(driverId, status) {
    try {
      const drivers = await this.getDriverData();
      const updatedDrivers = drivers.map(driver => 
        driver.id === driverId ? { ...driver, status } : driver
      );
      await AsyncStorage.setItem(DB_KEYS.DRIVER_DATA, JSON.stringify(updatedDrivers));
      return true;
    } catch (error) {
      console.error('Error updating driver status:', error);
      return false;
    }
  }

  // Ride Requests Management
  async saveRideRequest(request) {
    try {
      const requests = await this.getRideRequests();
      const newRequest = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'pending',
        ...request
      };
      requests.unshift(newRequest);
      await AsyncStorage.setItem(DB_KEYS.RIDE_REQUESTS, JSON.stringify(requests));
      return newRequest.id;
    } catch (error) {
      console.error('Error saving ride request:', error);
      return null;
    }
  }

  async getRideRequests() {
    try {
      const requests = await AsyncStorage.getItem(DB_KEYS.RIDE_REQUESTS);
      return requests ? JSON.parse(requests) : [];
    } catch (error) {
      console.error('Error getting ride requests:', error);
      return [];
    }
  }

  async updateRideRequestStatus(requestId, status) {
    try {
      const requests = await this.getRideRequests();
      const updatedRequests = requests.map(request => 
        request.id === requestId ? { ...request, status } : request
      );
      await AsyncStorage.setItem(DB_KEYS.RIDE_REQUESTS, JSON.stringify(updatedRequests));
      return true;
    } catch (error) {
      console.error('Error updating ride request status:', error);
      return false;
    }
  }

  // Payment Methods Management
  async savePaymentMethod(paymentMethod) {
    try {
      const methods = await this.getPaymentMethods();
      const newMethod = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...paymentMethod
      };
      methods.push(newMethod);
      await AsyncStorage.setItem(DB_KEYS.PAYMENT_METHODS, JSON.stringify(methods));
      return newMethod.id;
    } catch (error) {
      console.error('Error saving payment method:', error);
      return null;
    }
  }

  async getPaymentMethods() {
    try {
      const methods = await AsyncStorage.getItem(DB_KEYS.PAYMENT_METHODS);
      return methods ? JSON.parse(methods) : [];
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return [];
    }
  }

  async removePaymentMethod(methodId) {
    try {
      const methods = await this.getPaymentMethods();
      const filteredMethods = methods.filter(method => method.id !== methodId);
      await AsyncStorage.setItem(DB_KEYS.PAYMENT_METHODS, JSON.stringify(filteredMethods));
      return true;
    } catch (error) {
      console.error('Error removing payment method:', error);
      return false;
    }
  }

  // App Settings Management
  async saveAppSettings(settings) {
    try {
      const currentSettings = await this.getAppSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(DB_KEYS.APP_SETTINGS, JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      console.error('Error saving app settings:', error);
      return false;
    }
  }

  async getAppSettings() {
    try {
      const settings = await AsyncStorage.getItem(DB_KEYS.APP_SETTINGS);
      return settings ? JSON.parse(settings) : {
        language: 'pt',
        theme: 'light',
        notifications: true,
        defaultTaxiType: 'Coletivo',
        autoLocation: true
      };
    } catch (error) {
      console.error('Error getting app settings:', error);
      return {
        language: 'pt',
        theme: 'light',
        notifications: true,
        defaultTaxiType: 'Coletivo',
        autoLocation: true
      };
    }
  }

  // Search History Management
  async saveSearchQuery(query) {
    try {
      const history = await this.getSearchHistory();
      const newSearch = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        query
      };
      
      // Remove duplicates and add to beginning
      const filteredHistory = history.filter(item => item.query !== query);
      filteredHistory.unshift(newSearch);
      
      // Keep only last 20 searches
      const limitedHistory = filteredHistory.slice(0, 20);
      await AsyncStorage.setItem(DB_KEYS.SEARCH_HISTORY, JSON.stringify(limitedHistory));
      return true;
    } catch (error) {
      console.error('Error saving search query:', error);
      return false;
    }
  }

  async getSearchHistory() {
    try {
      const history = await AsyncStorage.getItem(DB_KEYS.SEARCH_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  async clearSearchHistory() {
    try {
      await AsyncStorage.removeItem(DB_KEYS.SEARCH_HISTORY);
      return true;
    } catch (error) {
      console.error('Error clearing search history:', error);
      return false;
    }
  }

  // Routes Cache Management
  async saveRouteCache(origin, destination, routeData) {
    try {
      const cache = await this.getRoutesCache();
      const cacheKey = `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`;
      
      cache[cacheKey] = {
        timestamp: new Date().toISOString(),
        data: routeData
      };
      
      // Keep only last 100 cached routes
      const cacheKeys = Object.keys(cache);
      if (cacheKeys.length > 100) {
        const oldestKey = cacheKeys[0];
        delete cache[oldestKey];
      }
      
      await AsyncStorage.setItem(DB_KEYS.ROUTES_CACHE, JSON.stringify(cache));
      return true;
    } catch (error) {
      console.error('Error saving route cache:', error);
      return false;
    }
  }

  async getRoutesCache() {
    try {
      const cache = await AsyncStorage.getItem(DB_KEYS.ROUTES_CACHE);
      return cache ? JSON.parse(cache) : {};
    } catch (error) {
      console.error('Error getting routes cache:', error);
      return {};
    }
  }

  async getCachedRoute(origin, destination) {
    try {
      const cache = await this.getRoutesCache();
      const cacheKey = `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`;
      const cachedRoute = cache[cacheKey];
      
      if (cachedRoute) {
        // Check if cache is still valid (24 hours)
        const cacheAge = Date.now() - new Date(cachedRoute.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (cacheAge < maxAge) {
          return cachedRoute.data;
        } else {
          // Remove expired cache
          delete cache[cacheKey];
          await AsyncStorage.setItem(DB_KEYS.ROUTES_CACHE, JSON.stringify(cache));
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached route:', error);
      return null;
    }
  }

  // Notifications Management
  async saveNotification(notification) {
    try {
      const notifications = await this.getNotifications();
      const newNotification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
        ...notification
      };
      notifications.unshift(newNotification);
      
      // Keep only last 50 notifications
      const limitedNotifications = notifications.slice(0, 50);
      await AsyncStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(limitedNotifications));
      return newNotification.id;
    } catch (error) {
      console.error('Error saving notification:', error);
      return null;
    }
  }

  async getNotifications() {
    try {
      const notifications = await AsyncStorage.getItem(DB_KEYS.NOTIFICATIONS);
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const notifications = await this.getNotifications();
      const updatedNotifications = notifications.map(notification => 
        notification.id === notificationId ? { ...notification, read: true } : notification
      );
      await AsyncStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async clearAllNotifications() {
    try {
      await AsyncStorage.removeItem(DB_KEYS.NOTIFICATIONS);
      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  }

  // Database Utilities
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove(Object.values(DB_KEYS));
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  async getDatabaseSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      let totalSize = 0;
      
      stores.forEach(([key, value]) => {
        if (value) {
          totalSize += value.length;
        }
      });
      
      return totalSize;
    } catch (error) {
      console.error('Error getting database size:', error);
      return 0;
    }
  }

  // === PASSENGER PROFILE METHODS ===
  async savePassengerProfile(profile) {
    try {
      await AsyncStorage.setItem(DB_KEYS.PASSENGER_PROFILE, JSON.stringify(profile));
      return true;
    } catch (error) {
      console.error('Error saving passenger profile:', error);
      return false;
    }
  }

  async getPassengerProfile() {
    try {
      const profile = await AsyncStorage.getItem(DB_KEYS.PASSENGER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting passenger profile:', error);
      return null;
    }
  }

  async updatePassengerProfile(updates) {
    try {
      const currentProfile = await this.getPassengerProfile();
      if (currentProfile) {
        const updatedProfile = { ...currentProfile, ...updates };
        await AsyncStorage.setItem(DB_KEYS.PASSENGER_PROFILE, JSON.stringify(updatedProfile));
        return updatedProfile;
      }
      return null;
    } catch (error) {
      console.error('Error updating passenger profile:', error);
      return null;
    }
  }

  async exportDatabase() {
    try {
      const data = {};
      for (const [key, dbKey] of Object.entries(DB_KEYS)) {
        const value = await AsyncStorage.getItem(dbKey);
        data[key] = value ? JSON.parse(value) : null;
      }
      return data;
    } catch (error) {
      console.error('Error exporting database:', error);
      return null;
    }
  }

  async importDatabase(data) {
    try {
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && DB_KEYS[key]) {
          await AsyncStorage.setItem(DB_KEYS[key], JSON.stringify(value));
        }
      }
      return true;
    } catch (error) {
      console.error('Error importing database:', error);
      return false;
    }
  }
}

export default new LocalDatabase();
