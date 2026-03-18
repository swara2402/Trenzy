import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, MessageCircle, TrendingUp, Users2, Trash2, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useGroups } from '@/contexts/GroupContext';
import { createGroup, getGroups, getGroupRecommendations, deleteGroup } from '@/lib/groups';
import type { Group, GroupMember } from '@/lib/groups';
import Footer from '@/components/Footer';

export default function GroupDashboard() {
  const { groups, dispatch } = useGroups();
  const [loading, setLoading] = useState(true);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedGroupRecommendations, setSelectedGroupRecommendations] = useState<any[]>([]);
  const [currentGroupRecsLoading, setCurrentGroupRecsLoading] = useState(false);
  const [friends, setFriends] = useState<{ id: string; username: string }[]>([]); // Mock friends
  const [selectedFriend, setSelectedFriend] = useState('');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<Group | null>(null);
  const navigate = useNavigate();

  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await getGroups();
      dispatch({ type: 'SET_GROUPS', payload: data.groups || [] });
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    setCreatingGroup(true);
    try {
      const data = await createGroup(newGroupForm.name, newGroupForm.description);
      dispatch({ type: 'ADD_GROUP', payload: data.group });
      setNewGroupForm({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setCreatingGroup(false);
    }
  };

  const loadGroupRecommendations = async (groupId: string) => {
    setCurrentGroupRecsLoading(true);
    try {
      const data = await getGroupRecommendations(groupId);
      setSelectedGroupRecommendations(data.products || []);
    } catch (error) {
      console.error('Failed to load group recs:', error);
    } finally {
      setCurrentGroupRecsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group?')) return;
    try {
      await deleteGroup(groupId);
      dispatch({ type: 'SET_GROUPS', payload: groups.filter(g => g.id !== groupId) });
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const mockFriends = [
    { id: '1', username: 'alice' },
    { id: '2', username: 'bob' },
    { id: '3', username: 'charlie' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8">
          <Link to="/" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
            ← Home
          </Link>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent mb-4">
              Group Shopping
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create groups with friends, merge preferences, and discover perfect products for everyone.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Create Group */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Group
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Group name (e.g., Family Trip, Office Gifts)"
                    value={newGroupForm.name}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newGroupForm.description}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, description: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateGroup} disabled={creatingGroup || !newGroupForm.name} className="w-full" size="lg">
                  {creatingGroup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </Button>
              </CardContent>
            </Card>

            {/* Your Groups */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Groups</h2>
                <Badge variant="secondary" className="text-sm">{groups.length}</Badge>
              </div>

              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : groups.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first group to start collaborative shopping</p>
                    <Button>Create Group</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {groups.map((group) => (
                    <Card key={group.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {group.name}
                              <Badge variant="secondary">{group.members.length}</Badge>
                            </CardTitle>
                            <CardDescription>{group.description || 'No description'}</CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Member to {group.name}</DialogTitle>
                                  <DialogDescription>Select a friend</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2">
                                  {mockFriends.map((friend) => (
                                    <Button key={friend.id} variant="ghost" className="justify-start w-full h-auto p-3" 
                                      onClick={() => {
                                        // updateGroupMembers(group.id, friend.id, 'add');
                                        setShowAddMemberDialog(false);
                                      }}>
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center font-medium">
                                          {friend.username[0].toUpperCase()}
                                        </div>
                                        <span>{friend.username}</span>
                                      </div>
                                    </Button>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="sm" onClick={() => loadGroupRecommendations(group.id)}>
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {currentGroupRecsLoading ? (
                          <Skeleton className="h-20 w-full" />
                        ) : selectedGroupRecommendations.length > 0 ? (
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {selectedGroupRecommendations.slice(0, 4).map((product: any) => (
                              <div key={product.id} className="flex-shrink-0 w-20">
                                <img src={product.images?.[0] || '/placeholder.svg'} alt={product.name} className="w-20 h-20 object-cover rounded" />
                                <p className="text-xs mt-1 truncate">{product.name}</p>
                                <p className="text-xs font-medium text-green-600">₹{product.price}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Best for your group recommendations will appear here</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

