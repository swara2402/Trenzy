import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Vote {
  friendId: string;
  vote: 'like' | 'dislike';
  comment?: string;
}

export interface Suggestion {
  id: string;
  productId: string;
  votes: Vote[];
  summary: {
    likes: number;
    dislikes: number;
    avgRating: number;
  };
}

interface SuggestionState {
  suggestions: Record<string, Suggestion>;
  loading: boolean;
}

type SuggestionAction =
  | { type: 'SET_SUGGESTIONS'; payload: Record<string, Suggestion> }
  | { type: 'ADD_VOTE'; payload: { suggestionId: string; vote: Vote } }
  | { type: 'SET_LOADING'; payload: boolean };

const SuggestionContext = createContext<SuggestionState | null>(null);
const SuggestionDispatch = createContext<React.Dispatch<SuggestionAction> | null>(null);

const initialState: SuggestionState = {
  suggestions: {},
  loading: false,
};

function reducer(state: SuggestionState, action: SuggestionAction): SuggestionState {
  switch (action.type) {
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    case 'ADD_VOTE':
      const updatedSuggestions = { ...state.suggestions };
      if (updatedSuggestions[action.payload.suggestionId]) {
        updatedSuggestions[action.payload.suggestionId].votes.push(action.payload.vote);
      }
      return { ...state, suggestions: updatedSuggestions };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function SuggestionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <SuggestionContext.Provider value={state}>
      <SuggestionDispatch.Provider value={dispatch}>
        {children}
      </SuggestionDispatch.Provider>
    </SuggestionContext.Provider>
  );
}

export function useSuggestions() {
  const context = useContext(SuggestionContext);
  const dispatch = useContext(SuggestionDispatch);
  if (!context || !dispatch) {
    throw new Error('useSuggestions must be within SuggestionProvider');
  }
  return { ...context, dispatch };
}
