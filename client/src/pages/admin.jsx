import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth-context';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Briefcase, 
  MessageSquare, 
  Flag, 
  Search,
  Trash2,
  Ban,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';
import AvatarImage from '@/components/ui/avatar-image';

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [skillPosts, setSkillPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogType, setDialogType] = useState(null); // 'delete' | 'ban' | 'view'
  
  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this page",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [user, navigate, toast]);
  
  // Fetch initial data
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const usersQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        setUsers(usersData);
        
        // Fetch skill posts
        const skillPostsQuery = query(
          collection(db, "skillPosts"),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        
        const skillPostsSnapshot = await getDocs(skillPostsQuery);
        const skillPostsData = skillPostsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        setSkillPosts(skillPostsData);
        
        // Fetch reports
        const reportsQuery = query(
          collection(db, "reports"),
          orderBy("createdAt", "desc")
        );
        
        const reportsSnapshot = await getDocs(reportsQuery);
        const reportsData = reportsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        setReports(reportsData);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast({
          title: "Error loading data",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, toast]);
  
  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Filter items based on search
  const filterItems = (items) => {
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    
    return items.filter(item => {
      // For users
      if (item.displayName) {
        return (
          item.displayName.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          item.role?.toLowerCase().includes(query)
        );
      }
      
      // For skill posts
      if (item.title) {
        return (
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.mentorName?.toLowerCase().includes(query)
        );
      }
      
      // For reports
      if (item.reason) {
        return (
          item.reason.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.reportedBy?.toLowerCase().includes(query)
        );
      }
      
      return false;
    });
  };
  
  // Handle ban user
  const handleBanUser = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        banned: true,
        banReason: "Violated terms of service",
        bannedAt: serverTimestamp()
      });
      
      // Update local users list
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, banned: true } : user
      ));
      
      toast({
        title: "User banned",
        description: "The user has been banned from the platform",
      });
      
      setDialogType(null);
    } catch (error) {
      console.error("Error banning user:", error);
      toast({
        title: "Error banning user",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  // Handle unban user
  const handleUnbanUser = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        banned: false,
        banReason: null,
        bannedAt: null
      });
      
      // Update local users list
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, banned: false } : user
      ));
      
      toast({
        title: "User unbanned",
        description: "The user has been unbanned and can use the platform again",
      });
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast({
        title: "Error unbanning user",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  // Handle delete skill post
  const handleDeleteSkillPost = async (postId) => {
    try {
      await deleteDoc(doc(db, "skillPosts", postId));
      
      // Update local skill posts list
      setSkillPosts(prev => prev.filter(post => post.id !== postId));
      
      toast({
        title: "Skill post deleted",
        description: "The skill post has been removed from the platform",
      });
      
      setDialogType(null);
    } catch (error) {
      console.error("Error deleting skill post:", error);
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  // Handle resolve report
  const handleResolveReport = async (reportId) => {
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: "resolved",
        resolvedAt: serverTimestamp(),
        resolvedBy: user.uid
      });
      
      // Update local reports list
      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, status: "resolved" } : report
      ));
      
      toast({
        title: "Report resolved",
        description: "The report has been marked as resolved",
      });
    } catch (error) {
      console.error("Error resolving report:", error);
      toast({
        title: "Error resolving report",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Admin privileges required</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have permission to view this page.
            </p>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Shield className="h-8 w-8 text-primary-500 mr-3" />
        <div>
          <h1 className="text-3xl font-bold font-heading">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users, content, and platform settings</p>
        </div>
      </div>
      
      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="skills">
            <Briefcase className="h-4 w-4 mr-2" />
            Skill Posts
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Flag className="h-4 w-4 mr-2" />
            Reports
            {reports.filter(r => r.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-red-500">{reports.filter(r => r.status === 'pending').length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="search"
              placeholder={`Search ${activeTab}...`}
              className="pl-9"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterItems(users).length > 0 ? (
                      filterItems(users).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <AvatarImage
                                src={user.photoURL}
                                alt={user.displayName || 'User'}
                                size="sm"
                              />
                              <span className="font-medium">{user.displayName || 'Unnamed User'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {user.role === 'both' ? 'Mentor & Learner' : 
                               user.role === 'mentor' ? 'Mentor' : 
                               user.role === 'learner' ? 'Learner' : 
                               user.role === 'admin' ? 'Admin' : 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {user.banned ? (
                              <Badge variant="destructive">Banned</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(user);
                                  setDialogType('view');
                                }}
                              >
                                View
                              </Button>
                              
                              {user.banned ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnbanUser(user.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Unban
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => {
                                    setSelectedItem(user);
                                    setDialogType('ban');
                                  }}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Ban
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          <p className="text-gray-500 dark:text-gray-400">
                            {searchQuery ? 'No users match your search' : 'No users found'}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Skill Posts Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skill Posts</CardTitle>
              <CardDescription>
                Manage skill posts and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterItems(skillPosts).length > 0 ? (
                      filterItems(skillPosts).map((post) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div className="font-medium truncate max-w-xs" title={post.title}>
                              {post.title}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {post.tags && post.tags.slice(0, 2).map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {post.tags && post.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{post.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{post.mentorName || 'Unknown'}</TableCell>
                          <TableCell>
                            {post.active ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-500 mr-1" />
                              <span>{post.rating?.toFixed(1) || 'N/A'}</span>
                              {post.reviewCount > 0 && (
                                <span className="text-xs text-gray-500 ml-1">({post.reviewCount})</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(post);
                                  setDialogType('view');
                                }}
                              >
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => {
                                  setSelectedItem(post);
                                  setDialogType('delete');
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          <p className="text-gray-500 dark:text-gray-400">
                            {searchQuery ? 'No skill posts match your search' : 'No skill posts found'}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Handle reported content and users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reported Item</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Reported By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterItems(reports).length > 0 ? (
                      filterItems(reports).map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <Badge variant="outline">{report.type}</Badge>
                          </TableCell>
                          <TableCell className="font-medium truncate max-w-xs">
                            {report.itemId}
                          </TableCell>
                          <TableCell>{report.reason}</TableCell>
                          <TableCell>{report.reporterName || 'Anonymous'}</TableCell>
                          <TableCell>
                            {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {report.status === 'resolved' ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Resolved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(report);
                                  setDialogType('view');
                                }}
                              >
                                View
                              </Button>
                              
                              {report.status !== 'resolved' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleResolveReport(report.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                          <p className="text-gray-500 dark:text-gray-400">
                            {searchQuery ? 'No reports match your search' : 'No reports found'}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Confirmation Dialogs */}
      <Dialog open={dialogType === 'ban'} onOpenChange={() => dialogType === 'ban' && setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              This will prevent the user from accessing the platform
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="py-4">
              <p className="mb-4">
                Are you sure you want to ban <span className="font-medium">{selectedItem.displayName || selectedItem.email}</span>?
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                This action can be reversed later.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedItem && handleBanUser(selectedItem.id)}
            >
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={dialogType === 'delete'} onOpenChange={() => dialogType === 'delete' && setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Skill Post</DialogTitle>
            <DialogDescription>
              This action cannot be undone
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="py-4">
              <p className="mb-4">
                Are you sure you want to delete <span className="font-medium">{selectedItem.title}</span>?
              </p>
              <p className="text-red-600 dark:text-red-400 text-sm">
                This action permanently removes the skill post from the platform.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedItem && handleDeleteSkillPost(selectedItem.id)}
            >
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Details Dialog */}
      <Dialog open={dialogType === 'view'} onOpenChange={() => dialogType === 'view' && setDialogType(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.displayName 
                ? `User Details: ${selectedItem.displayName}`
                : selectedItem?.title
                ? `Skill Post: ${selectedItem.title}`
                : selectedItem?.reason
                ? `Report Details`
                : 'Item Details'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="py-2 space-y-4">
              {/* User Details */}
              {selectedItem.email && (
                <div>
                  <div className="flex items-center space-x-4 mb-4">
                    <AvatarImage
                      src={selectedItem.photoURL}
                      alt={selectedItem.displayName || 'User'}
                      size="lg"
                    />
                    <div>
                      <h3 className="text-lg font-medium">{selectedItem.displayName}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{selectedItem.email}</p>
                      <div className="flex items-center mt-1">
                        <Badge variant="outline">
                          {selectedItem.role === 'both' ? 'Mentor & Learner' : 
                           selectedItem.role === 'mentor' ? 'Mentor' : 
                           selectedItem.role === 'learner' ? 'Learner' : 
                           selectedItem.role === 'admin' ? 'Admin' : 'Unknown'}
                        </Badge>
                        {selectedItem.banned && (
                          <Badge variant="destructive" className="ml-2">
                            Banned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Profile</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedItem.bio || 'No bio provided'}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Stats</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Sessions: {selectedItem.sessionsCompleted || 0}</li>
                        <li>XP: {selectedItem.xp || 0}</li>
                        <li>Joined: {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : 'Unknown'}</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium mb-2">Admin Actions</h4>
                    <div className="flex space-x-3">
                      {selectedItem.banned ? (
                        <Button size="sm" onClick={() => handleUnbanUser(selectedItem.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Unban User
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => {
                            setDialogType('ban');
                          }}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Ban User
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/profile/${selectedItem.id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Skill Post Details */}
              {selectedItem.title && (
                <div>
                  <div className="mb-4">
                    {selectedItem.imageUrl && (
                      <img 
                        src={selectedItem.imageUrl}
                        alt={selectedItem.title}
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="text-lg font-medium">{selectedItem.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      By {selectedItem.mentorName || 'Unknown mentor'}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedItem.description || 'No description provided'}
                    </p>
                  </div>
                  
                  {selectedItem.tags && selectedItem.tags.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Status</h4>
                      <Badge variant={selectedItem.active ? "success" : "secondary"}>
                        {selectedItem.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Rating</h4>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span>{selectedItem.rating?.toFixed(1) || 'N/A'}</span>
                        {selectedItem.reviewCount > 0 && (
                          <span className="text-sm text-gray-500 ml-1">({selectedItem.reviewCount})</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium mb-2">Admin Actions</h4>
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => {
                          setDialogType('delete');
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Post
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDialogType(null)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Report Details */}
              {selectedItem.reason && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium">Report #{selectedItem.id.substring(0, 6)}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={selectedItem.status === 'resolved' ? 'outline' : 'secondary'}>
                        {selectedItem.status === 'resolved' ? 'Resolved' : 'Pending'}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Reported on {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : 'Unknown date'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Reported Item</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <Badge variant="outline" className="mr-2">
                          {selectedItem.type}
                        </Badge>
                        ID: {selectedItem.itemId}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Reported By</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedItem.reporterName || 'Anonymous'}
                        {selectedItem.reporterId && <span className="text-xs ml-1">({selectedItem.reporterId})</span>}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Reason</h4>
                    <p className="text-sm font-medium">{selectedItem.reason}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedItem.description || 'No additional description provided'}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium mb-2">Admin Actions</h4>
                    <div className="flex space-x-3">
                      {selectedItem.status !== 'resolved' && (
                        <Button 
                          size="sm"
                          onClick={() => handleResolveReport(selectedItem.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark as Resolved
                        </Button>
                      )}
                      
                      {/* If it's a skill post report */}
                      {selectedItem.type === 'skillPost' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => {
                            // Set selected item to the skill post and open delete dialog
                            const skillPost = skillPosts.find(post => post.id === selectedItem.itemId);
                            if (skillPost) {
                              setSelectedItem(skillPost);
                              setDialogType('delete');
                            } else {
                              toast({
                                title: "Skill post not found",
                                description: "The reported skill post couldn't be found",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Post
                        </Button>
                      )}
                      
                      {/* If it's a user report */}
                      {selectedItem.type === 'user' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => {
                            // Set selected item to the user and open ban dialog
                            const reportedUser = users.find(u => u.id === selectedItem.itemId);
                            if (reportedUser) {
                              setSelectedItem(reportedUser);
                              setDialogType('ban');
                            } else {
                              toast({
                                title: "User not found",
                                description: "The reported user couldn't be found",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Ban User
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDialogType(null)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
