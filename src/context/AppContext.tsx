import React, {createContext, useContext, useReducer, ReactNode, useEffect} from 'react';
import {MoodEntry, ManifestationEntry, User, AppState, Alarm} from '../types';
import {StorageService} from '../services/storage/StorageService';
import {NotificationService} from '../services/notifications/NotificationService';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  saveMoodEntry: (entry: Omit<MoodEntry, 'id' | 'timestamp'>) => Promise<void>;
  saveManifestationEntry: (entry: Omit<ManifestationEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateMoodEntry: (id: string, updates: Partial<MoodEntry>) => Promise<void>;
  updateManifestationEntry: (id: string, updates: Partial<ManifestationEntry>) => Promise<void>;
  deleteMoodEntry: (id: string) => Promise<void>;
  deleteManifestationEntry: (id: string) => Promise<void>;
  loadUserData: () => Promise<void>;
  exportData: () => Promise<string>;
  clearAllData: () => Promise<void>;
}

type AppAction =
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_USER'; payload: User | null}
  | {type: 'SET_MOOD_ENTRIES'; payload: MoodEntry[]}
  | {type: 'SET_MANIFESTATION_ENTRIES'; payload: ManifestationEntry[]}
  | {type: 'SET_ALARMS'; payload: Alarm[]}
  | {type: 'ADD_MOOD_ENTRY'; payload: MoodEntry}
  | {type: 'ADD_MANIFESTATION_ENTRY'; payload: ManifestationEntry}
  | {type: 'ADD_ALARM'; payload: Alarm}
  | {type: 'UPDATE_MOOD_ENTRY'; payload: {id: string; updates: Partial<MoodEntry>}}
  | {type: 'UPDATE_MANIFESTATION_ENTRY'; payload: {id: string; updates: Partial<ManifestationEntry>}}
  | {type: 'UPDATE_ALARM'; payload: {id: string; updates: Partial<Alarm>}}
  | {type: 'DELETE_MOOD_ENTRY'; payload: string}
  | {type: 'DELETE_MANIFESTATION_ENTRY'; payload: string}
  | {type: 'DELETE_ALARM'; payload: string}
  | {type: 'CLEAR_ALL_DATA'};

const initialState: AppState = {
  user: null,
  moodEntries: [],
  manifestationEntries: [],
  alarms: [],
  isLoading: false,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {...state, isLoading: action.payload};
    case 'SET_USER':
      return {...state, user: action.payload};
    case 'SET_MOOD_ENTRIES':
      return {...state, moodEntries: action.payload};
    case 'SET_MANIFESTATION_ENTRIES':
      return {...state, manifestationEntries: action.payload};
    case 'SET_ALARMS':
      return {...state, alarms: action.payload};
    case 'ADD_MOOD_ENTRY':
      return {...state, moodEntries: [...state.moodEntries, action.payload]};
    case 'ADD_MANIFESTATION_ENTRY':
      return {...state, manifestationEntries: [...state.manifestationEntries, action.payload]};
    case 'ADD_ALARM':
      return {...state, alarms: [...state.alarms, action.payload]};
    case 'UPDATE_MOOD_ENTRY':
      return {
        ...state,
        moodEntries: state.moodEntries.map(entry =>
          entry.id === action.payload.id ? {...entry, ...action.payload.updates} : entry
        ),
      };
    case 'UPDATE_MANIFESTATION_ENTRY':
      return {
        ...state,
        manifestationEntries: state.manifestationEntries.map(entry =>
          entry.id === action.payload.id ? {...entry, ...action.payload.updates} : entry
        ),
      };
    case 'UPDATE_ALARM':
      return {
        ...state,
        alarms: state.alarms.map(alarm =>
          alarm.id === action.payload.id ? {...alarm, ...action.payload.updates} : alarm
        ),
      };
    case 'DELETE_MOOD_ENTRY':
      return {
        ...state,
        moodEntries: state.moodEntries.filter(entry => entry.id !== action.payload),
      };
    case 'DELETE_MANIFESTATION_ENTRY':
      return {
        ...state,
        manifestationEntries: state.manifestationEntries.filter(entry => entry.id !== action.payload),
      };
    case 'DELETE_ALARM':
      return {
        ...state,
        alarms: state.alarms.filter(alarm => alarm.id !== action.payload),
      };
    case 'CLEAR_ALL_DATA':
      return initialState;
    default:
      return state;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({children}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Initialize notification service
    NotificationService.initialize();
    
    // Load initial data
    loadUserData();
  }, []);

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const loadUserData = async (): Promise<void> => {
    try {
      dispatch({type: 'SET_LOADING', payload: true});
      
      const [userData, moodEntries, manifestationEntries] = await Promise.all([
        StorageService.getUserData(),
        StorageService.getMoodEntries(),
        StorageService.getManifestationEntries(),
      ]);

      dispatch({type: 'SET_USER', payload: userData});
      dispatch({type: 'SET_MOOD_ENTRIES', payload: moodEntries});
      dispatch({type: 'SET_MANIFESTATION_ENTRIES', payload: manifestationEntries});
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      dispatch({type: 'SET_LOADING', payload: false});
    }
  };

  const saveMoodEntry = async (entryData: Omit<MoodEntry, 'id' | 'timestamp'>): Promise<void> => {
    try {
      const entry: MoodEntry = {
        ...entryData,
        id: generateId(),
        timestamp: new Date(),
      };
      
      await StorageService.saveMoodEntry(entry);
      dispatch({type: 'ADD_MOOD_ENTRY', payload: entry});
    } catch (error) {
      console.error('Error saving mood entry:', error);
      throw error;
    }
  };

  const saveManifestationEntry = async (entryData: Omit<ManifestationEntry, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const entry: ManifestationEntry = {
        ...entryData,
        id: generateId(),
        createdAt: new Date(),
      };
      
      await StorageService.saveManifestationEntry(entry);
      dispatch({type: 'ADD_MANIFESTATION_ENTRY', payload: entry});
    } catch (error) {
      console.error('Error saving manifestation entry:', error);
      throw error;
    }
  };

  const updateMoodEntry = async (id: string, updates: Partial<MoodEntry>): Promise<void> => {
    try {
      await StorageService.updateMoodEntry(id, updates);
      dispatch({type: 'UPDATE_MOOD_ENTRY', payload: {id, updates}});
    } catch (error) {
      console.error('Error updating mood entry:', error);
      throw error;
    }
  };

  const updateManifestationEntry = async (
    id: string,
    updates: Partial<ManifestationEntry>
  ): Promise<void> => {
    try {
      await StorageService.updateManifestationEntry(id, updates);
      dispatch({type: 'UPDATE_MANIFESTATION_ENTRY', payload: {id, updates}});
    } catch (error) {
      console.error('Error updating manifestation entry:', error);
      throw error;
    }
  };

  const deleteMoodEntry = async (id: string): Promise<void> => {
    try {
      await StorageService.deleteMoodEntry(id);
      dispatch({type: 'DELETE_MOOD_ENTRY', payload: id});
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      throw error;
    }
  };

  const deleteManifestationEntry = async (id: string): Promise<void> => {
    try {
      await StorageService.deleteManifestationEntry(id);
      dispatch({type: 'DELETE_MANIFESTATION_ENTRY', payload: id});
    } catch (error) {
      console.error('Error deleting manifestation entry:', error);
      throw error;
    }
  };

  const exportData = async (): Promise<string> => {
    try {
      return await StorageService.exportData();
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  };

  const clearAllData = async (): Promise<void> => {
    try {
      await StorageService.clearAllData();
      dispatch({type: 'CLEAR_ALL_DATA'});
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  };

  const value: AppContextType = {
    state,
    dispatch,
    saveMoodEntry,
    saveManifestationEntry,
    updateMoodEntry,
    updateManifestationEntry,
    deleteMoodEntry,
    deleteManifestationEntry,
    loadUserData,
    exportData,
    clearAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};