"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  Mail,
  MessageSquare,
  Edit,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../../../../../context/AuthContext";

const LeadStatus = {
  OnProgress: "onprocess",
  Converted: "Converted",
  NotInterested: "notinterested",
};

export function LeadCard({ lead, onStatusChange, onDelete }) {
  const { id, name, phone, email, message, type, slug } = lead;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [showAddComment, setShowAddComment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { checkAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [id]);

  const fetchComments = async () => {
    setLoading(true);
    setError("");
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/lead/${id}`
      );
      setComments(response.data.data.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setError("Failed to fetch comments");
      toast({
        title: "Error",
        description: "Failed to fetch comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    if (newComment.trim()) {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/comments`,
          {
            message: newComment,
            lead_id: id,
          }
        );
        setComments([...comments, response.data.data]);
        setNewComment("");
        setShowAddComment(false);
        toast({
          title: "Success",
          description: "Comment added successfully",
        });
      } catch (error) {
        console.error("Error adding comment:", error);
        toast({
          title: "Error",
          description: "Failed to add comment",
          variant: "destructive",
        });
      }
    }
  };

  const editComment = async (commentId, newText) => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/${commentId}`,
        {
          message: newText,
        }
      );
      setComments(
        comments.map((comment) =>
          comment.id === commentId ? { ...comment, message: newText } : comment
        )
      );
      setEditingCommentId(null);
      setEditingCommentText("");
      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    } catch (error) {
      console.error("Error editing comment:", error);
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    }
  };

  const deleteComment = async (commentId) => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/${commentId}`
      );
      setComments(comments.filter((comment) => comment.id !== commentId));
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  const getHeaderColor = (type) => {
    switch (type) {
      case LeadStatus.OnProgress:
        return "bg-yellow-500";
      case LeadStatus.NotInterested:
        return "bg-red-500";
      case LeadStatus.Converted:
        return "bg-green-500";
      default:
        return "bg-primary";
    }
  };

  const getStatusLabel = (type) => {
    switch (type) {
      case LeadStatus.OnProgress:
        return "On Progress";
      case LeadStatus.NotInterested:
        return "Not Interested";
      case LeadStatus.Converted:
        return "Converted";
      default:
        return type;
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className={`${getHeaderColor(type)} text-white rounded-t-lg`}>
        <CardTitle className="flex justify-between items-center">
          <span className="text-lg font-bold">{name}</span>
          <Badge
            variant={
              type === LeadStatus.OnProgress
                ? "warning"
                : type === LeadStatus.NotInterested
                ? "destructive"
                : "success"
            }
            className="text-sm font-medium border border-white"
          >
            {getStatusLabel(type)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {phone && (
          <div className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <p className="text-foreground">{phone}</p>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <p className="text-foreground">{email}</p>
        </div>
        <div>
          <p className="font-semibold text-foreground flex items-center">
            <MessageSquare className="h-5 w-5 text-muted-foreground mr-2" />
            Message:
          </p>
          <p className="text-foreground mt-1">{message}</p>
        </div>
      </CardContent>
      <CardContent>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-foreground">
              Comments:
              <span className="text-muted-foreground ml-2 text-sm font-normal">
                {comments.length}
              </span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddComment(!showAddComment)}
            >
              {showAddComment ? (
                <X className="h-4 w-4 mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {showAddComment ? "Cancel" : "Add Comment"}
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full bg-gray-300" />
              ))}
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : comments.length === 0 ? (
            <p className="text-muted-foreground">No comments found.</p>
          ) : (
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-muted p-3 rounded-lg mb-2 text-muted-foreground"
                >
                  {editingCommentId === comment.id ? (
                    <>
                      <Textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="mt-2"
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            editComment(comment.id, editingCommentText)
                          }
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCommentId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-foreground">{comment.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created at: {formatDate(comment.created_at)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated at: {formatDate(comment.updated_at)}
                      </p>
                      <div className="flex justify-end space-x-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditingCommentText(comment.message);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the comment.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteComment(comment.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </ScrollArea>
          )}
          {showAddComment && (
            <div className="mt-4">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="mb-2"
              />
              <Button onClick={addComment}>Add Comment</Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-muted rounded-b-lg p-4 space-y-2 sm:space-y-0">
        <Select
          onValueChange={(value) => onStatusChange(slug, value)}
          value={type}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Update Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={LeadStatus.OnProgress}>On Progress</SelectItem>
            <SelectItem value={LeadStatus.NotInterested}>
              Not Interested
            </SelectItem>
            <SelectItem value={LeadStatus.Converted}>Converted</SelectItem>
          </SelectContent>
        </Select>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Lead
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                lead and remove the data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(slug)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
