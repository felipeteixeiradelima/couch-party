import { useContext } from 'react';
import {
  PlayersContext,
  PlayersContextValue,
} from '@/contexts/PlayersContext';

/**
 * Accesses the global players state and management actions.
 */
export function usePlayers(): PlayersContextValue {
  const context = useContext(PlayersContext);

  if (!context) {
    throw new Error('usePlayers must be used within a PlayersProvider');
  }

  return context;
}
