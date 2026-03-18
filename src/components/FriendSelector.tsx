import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { getUserFriends } from '@/lib/suggestions';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Friend {
  id: string;
  username: string;
  avatar?: string;
}

interface Props {
  selectedFriends: string[];
  onSelectedChange: (friends: string[]) => void;
}

export default function FriendSelector({ selectedFriends, onSelectedChange }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserFriends().then(setFriends).finally(() => setLoading(false));
  }, []);

  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(search.toLowerCase()) &&
    !selectedFriends.includes(friend.id)
  );

  const handleSelect = (friendId: string) => {
    onSelectedChange([...selectedFriends, friendId]);
  };

  const handleRemove = (friendId: string) => {
    onSelectedChange(selectedFriends.filter(id => id !== friendId));
  };

  const selectedFriendObjects = friends.filter(f => selectedFriends.includes(f.id));

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium mb-2 block">Selected Friends ({selectedFriends.length})</label>
        {selectedFriendObjects.length === 0 ? (
          <p className="text-muted-foreground text-sm">No friends selected</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selectedFriendObjects.map(friend => (
              <Badge key={friend.id} variant="secondary" className="group">
                {friend.username}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 ml-1 rounded-sm p-0 group-hover:opacity-100 opacity-70"
                  onClick={() => handleRemove(friend.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Search friends</label>
        <Input
          placeholder="Search friends..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="max-h-40 overflow-y-auto">
        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-8">Loading friends...</p>
        ) : filteredFriends.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            {search ? 'No matching friends' : 'No friends found'}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer group"
                onClick={() => handleSelect(friend.id)}
              >
                <Checkbox 
                  id={`friend-${friend.id}`}
                  checked={selectedFriends.includes(friend.id)}
                  onCheckedChange={() => handleSelect(friend.id)}
                />
                <label 
                  htmlFor={`friend-${friend.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium">{friend.username}</div>
                  <div className="text-xs text-muted-foreground">Tap to ask opinion</div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
