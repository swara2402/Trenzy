import { ThumbsUp, ThumbsDown, MessageCircle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vote } from '@/contexts/SuggestionContext';
import { useSuggestions } from '@/contexts/SuggestionContext';
import { getSuggestionFeedback } from '@/lib/suggestions';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { submitVote } from '@/lib/suggestions';
import { useToast } from '@/hooks/use-toast';

interface Props {
  suggestionId: string;
  productId: string;
  className?: string;
}

export default function SuggestionFeedback({ suggestionId, productId, className = '' }: Props) {
  const { suggestions, dispatch } = useSuggestions();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const suggestion = suggestions[suggestionId];

  const handleVote = async (vote: 'like' | 'dislike') => {
    setLoading(true);
    try {
      const result = await submitVote(suggestionId, { friendId: 'current', vote });
      dispatch({ type: 'ADD_VOTE', payload: { suggestionId, vote: { friendId: 'current', vote } } });
      toast({ title: 'Vote submitted!' });
    } catch (error) {
      toast({ title: 'Vote failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!suggestion || suggestion.votes.length === 0) {
    return null;
  }

  const likes = suggestion.summary.likes;
  const dislikes = suggestion.summary.dislikes;
  const sentiment = likes > dislikes ? 'positive' : likes < dislikes ? 'negative' : 'neutral';

  return (
    <Card className={`mt-4 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Friends' Feedback ({suggestion.votes.length})
          <Badge variant={sentiment === 'positive' ? 'default' : sentiment === 'negative' ? 'destructive' : 'secondary'}>
            {sentiment.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-5 w-5 text-green-500" />
            <span className="font-bold">{likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown className="h-5 w-5 text-destructive" />
            <span className="font-bold">{dislikes}</span>
          </div>
          <div className="ml-auto flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVote('like')}
              disabled={loading}
              className="h-8 px-3"
            >
              Like
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVote('dislike')}
              disabled={loading}
              className="h-8 px-3"
            >
              Dislike
            </Button>
          </div>
        </div>

        {suggestion.votes.slice(0, 3).map((vote, index) => (
          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium truncate">{vote.friendId}</span>
                {vote.vote === 'like' ? (
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ThumbsDown className="h-4 w-4 text-destructive" />
                )}
              </div>
              {vote.comment && (
                <p className="text-sm text-muted-foreground">{vote.comment}</p>
              )}
            </div>
          </div>
        ))}

        {suggestion.votes.length > 3 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            +{suggestion.votes.length - 3} more responses
          </p>
        )}
      </CardContent>
    </Card>
  );
}
