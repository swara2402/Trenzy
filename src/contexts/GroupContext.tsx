import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Group {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  members: Array<{ userId: string; username: string; joinedAt: string }>;
  preferences?: any;
  _id?: string;
}

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  loading: boolean;
}

type GroupAction =
  | { type: 'SET_GROUPS'; payload: Group[] }
  | { type: 'ADD_GROUP'; payload: Group }
  | { type: 'SET_CURRENT_GROUP'; payload: Group | null }
  | { type: 'UPDATE_GROUP'; payload: Group }
  | { type: 'SET_LOADING'; payload: boolean };

const GroupContext = createContext<GroupState | null>(null);
const GroupDispatch = createContext<React.Dispatch<GroupAction> | null>(null);

const initialState: GroupState = {
  groups: [],
  currentGroup: null,
  loading: false,
};

function reducer(state: GroupState, action: GroupAction): GroupState {
  switch (action.type) {
    case 'SET_GROUPS':
      return { ...state, groups: action.payload };
    case 'ADD_GROUP':
      return { ...state, groups: [action.payload, ...state.groups] };
    case 'SET_CURRENT_GROUP':
      return { ...state, currentGroup: action.payload };
    case 'UPDATE_GROUP':
      const updatedGroups = state.groups.map(g => g.id === action.payload.id ? action.payload : g);
      return { 
        ...state, 
        groups: updatedGroups,
        currentGroup: state.currentGroup?.id === action.payload.id ? action.payload : state.currentGroup
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function GroupProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <GroupContext.Provider value={state}>
      <GroupDispatch.Provider value={dispatch}>
        {children}
      </GroupDispatch.Provider>
    </GroupContext.Provider>
  );
}

export function useGroups() {
  const context = useContext(GroupContext);
  const dispatch = useContext(GroupDispatch);
  if (!context || !dispatch) throw new Error('useGroups must be used within GroupProvider');
  return { ...context!, dispatch };
}

