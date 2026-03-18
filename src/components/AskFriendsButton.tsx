import { Button } from '@/components/ui/button';
import { Users, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import FriendSelector from './FriendSelector';
import { askFriendsForOpinion } from '@/lib/suggestions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface Props {
  productId: string;
  className?: string;
}

export default function AskFriendsButton({ productId, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const { toast } = useToast();

  const handleAskFriends = async () => {
    if (selectedFriends.length === 0) {
      toast({
        title: "No friends selected",
        description: "Select at least one friend to ask.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await askFriendsForOpinion(productId, selectedFriends);
      toast({
        title: "Friends Asked!",
        description: `Sent to ${selectedFriends.length} friends. Check back for feedback.`,
      });
      setOpen(false);
      setSelectedFriends([]);
    } catch (error) {
      toast({
        title: "Failed to send",
        description: "Try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Users className="mr-2 h-4 w-4" />
          Ask Friends
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Ask friends' opinion
          </DialogTitle>
          <DialogDescription>
            Select friends to get their feedback on this product.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <FriendSelector 
            selectedFriends={selectedFriends} 
            onSelectedChange={setSelectedFriends} 
          />
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleAskFriends} 
              disabled={loading || selectedFriends.length === 0}
              className="flex-1"
            >
              {loading ? 'Sending...' : `Ask ${selectedFriends.length} friend(s)`}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
