import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowUp, FaArrowDown, FaArrowLeft, FaComment } from 'react-icons/fa';
import apiClient from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const PostView = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        setLoading(true);
        setError(null);
        const [postResponse, commentsResponse] = await Promise.all([
          apiClient.get(`/fakbok/posts/${postId}`),
          apiClient.get(`/fakbok/posts/${postId}/comments`)
        ]);
        setPost(postResponse.data);
        setComments(commentsResponse.data);
      } catch (error) {
        console.error('Error fetching post:', error);
        setError(error.response?.data?.error || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [postId]);

  const handleVote = async (voteType) => {
    if (!user) {
      alert('Please log in to vote');
      return;
    }

    if (votingInProgress) return;

    setVotingInProgress(true);
    try {
      const response = await apiClient.post(`/fakbok/posts/${postId}/${voteType}`, {
        userId: user._id
      });
      setPost(response.data);
    } catch (error) {
      console.error(`Error ${voteType}ing post:`, error);
      alert(error.response?.data?.error || `Failed to ${voteType} post`);
    } finally {
      setVotingInProgress(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to comment');
      return;
    }

    if (!newComment.trim()) return;

    try {
      const response = await apiClient.post(`/fakbok/posts/${postId}/comments`, {
        body: newComment.trim(),
        author_id: user._id,
        post_id: postId
      });

      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      alert(error.response?.data?.error || 'Failed to post comment');
    }
  };

  const getVoteStatus = (post) => {
    if (!user || !post) return 'none';
    if (post.upvotes?.includes(user._id)) return 'upvoted';
    if (post.downvotes?.includes(user._id)) return 'downvoted';
    return 'none';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500 text-center">{error}</div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center text-blue-500 hover:text-blue-700"
        >
          <FaArrowLeft className="mr-2" /> Go Back
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Post not found</div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center text-blue-500 hover:text-blue-700"
        >
          <FaArrowLeft className="mr-2" /> Go Back
        </button>
      </div>
    );
  }

  const voteStatus = getVoteStatus(post);

  return (
    <div className="container mx-auto p-4 bg-white">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-blue-500 hover:text-blue-700"
      >
        <FaArrowLeft className="mr-2" /> Back to Feed
      </button>

      <div className="bg-gray-100 rounded-lg shadow-md p-4">
        <div className="flex items-start space-x-4">
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleVote('upvote')}
              disabled={votingInProgress}
              className={`p-1 rounded transition-colors ${
                voteStatus === 'upvoted'
                  ? 'text-orange-500 bg-orange-100'
                  : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'
              } disabled:opacity-50`}
              title={voteStatus === 'upvoted' ? 'Remove upvote' : 'Upvote'}
            >
              <FaArrowUp size={20} />
            </button>
            <span className={`text-sm font-semibold ${
              voteStatus === 'upvoted' ? 'text-orange-500' :
              voteStatus === 'downvoted' ? 'text-blue-500' :
              'text-gray-700'
            }`}>
              {(post.upvotes?.length || 0) - (post.downvotes?.length || 0)}
            </span>
            <button
              onClick={() => handleVote('downvote')}
              disabled={votingInProgress}
              className={`p-1 rounded transition-colors ${
                voteStatus === 'downvoted'
                  ? 'text-blue-500 bg-blue-100'
                  : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
              } disabled:opacity-50`}
              title={voteStatus === 'downvoted' ? 'Remove downvote' : 'Downvote'}
            >
              <FaArrowDown size={20} />
            </button>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{post.title}</h1>
            <p className="text-sm text-gray-500 mb-2">
              Posted by {post.author_id?.username || 'Unknown'} in {post.community_id?.name || 'Unknown Community'}
            </p>
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.body}</p>
            {post.media_url && (
              <div className="mb-4">
                <img
                  src={post.media_url}
                  alt="Post content"
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxHeight: '600px', objectFit: 'contain' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Comments</h2>
        {user ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Post Comment
            </button>
          </form>
        ) : (
          <p className="mb-6 text-gray-600">
            Please <button onClick={() => navigate('/login')} className="text-blue-500 hover:text-blue-700">log in</button> to comment
          </p>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">
                {comment.author_id?.username || 'Unknown'} • {new Date(comment.createdAt).toLocaleDateString()}
              </p>
              <p className="text-gray-700">{comment.body}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-gray-600 text-center">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostView;
