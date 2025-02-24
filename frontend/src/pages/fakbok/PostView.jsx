import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
        userId: user.id
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
        author_id: user.id,
        post_id: postId
      });

      // Only add the comment if it has valid author information
      if (response.data && response.data.author_id) {
        setComments(prevComments => [response.data, ...prevComments]);
        setNewComment('');
      } else {
        console.error('Received comment without author:', response.data);
        alert('Error: Comment was created but author information is missing');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert(error.response?.data?.error || 'Failed to post comment');
    }
  };

  const getVoteStatus = (post) => {
    if (!user || !post) return 'none';
    if (post.upvotes?.includes(user.id)) return 'upvoted';
    if (post.downvotes?.includes(user.id)) return 'downvoted';
    return 'none';
  };

  const handleCommentVote = async (commentId, voteType) => {
    if (!user) {
      alert('Please log in to vote');
      return;
    }

    try {
      const response = await apiClient.post(`/fakbok/comments/${commentId}/vote`, {
        userId: user.id,
        voteType
      });

      // Update the comment in the comments list
      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === commentId ? response.data : comment
        )
      );
    } catch (error) {
      console.error('Error voting on comment:', error);
      alert(error.response?.data?.error || 'Failed to vote on comment');
    }
  };

  const getCommentVoteStatus = (comment) => {
    if (!user) return 'none';
    if (comment.upvotes?.includes(user.id)) return 'upvoted';
    if (comment.downvotes?.includes(user.id)) return 'downvoted';
    return 'none';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="animate-pulse text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-center">{error}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaArrowLeft className="mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8 mb-4">
            <p className="text-gray-600 text-lg">Post not found</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaArrowLeft className="mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const voteStatus = getVoteStatus(post);

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 sm:mb-6 inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <FaArrowLeft className="mr-2" /> Back to Feed
        </button>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:gap-6">
              {/* Vote Column - Horizontal on mobile, Vertical on desktop */}
              <div className="flex sm:flex-col items-center justify-center sm:justify-start space-x-4 sm:space-x-0 sm:space-y-2 mb-4 sm:mb-0">
                <button
                  onClick={() => handleVote('upvote')}
                  disabled={votingInProgress}
                  className={`p-2 rounded-lg transition-all transform hover:scale-110 ${
                    voteStatus === 'upvoted'
                      ? 'text-orange-500 bg-orange-50'
                      : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                  } disabled:opacity-50`}
                  title={voteStatus === 'upvoted' ? 'Remove upvote' : 'Upvote'}
                >
                  <FaArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <span className={`text-base sm:text-lg font-bold ${
                  voteStatus === 'upvoted' ? 'text-orange-500' :
                  voteStatus === 'downvoted' ? 'text-blue-500' :
                  'text-gray-700'
                }`}>
                  {(post.upvotes?.length || 0) - (post.downvotes?.length || 0)}
                </span>
                <button
                  onClick={() => handleVote('downvote')}
                  disabled={votingInProgress}
                  className={`p-2 rounded-lg transition-all transform hover:scale-110 ${
                    voteStatus === 'downvoted'
                      ? 'text-blue-500 bg-blue-50'
                      : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                  } disabled:opacity-50`}
                  title={voteStatus === 'downvoted' ? 'Remove downvote' : 'Downvote'}
                >
                  <FaArrowDown className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Content Column */}
              <div className="flex-1">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{post.title}</h1>
                <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                  <Link to={`/${post.author_id?.username}`} className="flex-shrink-0 group">
                    {post.author_id?.avatar ? (
                      <img
                        src={post.author_id.avatar}
                        alt={post.author_id.username}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
                        <span className="text-blue-600 text-sm sm:text-lg font-medium">
                          {post.author_id?.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div>
                    <Link 
                      to={`/${post.author_id?.username}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {post.author_id?.username || 'Unknown'}
                    </Link>
                    <p className="text-xs sm:text-sm text-gray-500">
                      in {post.community_id?.name || 'Unknown Community'}
                    </p>
                  </div>
                </div>

                <div className="prose max-w-none mb-4 sm:mb-6">
                  <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap leading-relaxed">{post.body}</p>
                </div>

                {post.media_url && (
                  <div className="mb-4 sm:mb-6 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={post.media_url}
                      alt="Post content"
                      className="w-full h-auto object-contain max-h-[300px] sm:max-h-[600px]"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center py-3 sm:py-4 border-t border-gray-100">
                  <button 
                    onClick={() => document.querySelector('textarea')?.focus()}
                    className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <FaComment className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">{comments.length} Comments</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 sm:mt-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Comments</h2>
          
          {user ? (
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
              <form onSubmit={handleSubmitComment}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="What are your thoughts?"
                  className="w-full p-3 sm:p-4 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows="4"
                />
                <div className="mt-3 sm:mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base transition-all ${
                      newComment.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Comment
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 text-center">
              <p className="text-sm sm:text-base text-gray-600">
                Please{' '}
                <button 
                  onClick={() => navigate('/login')} 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  log in
                </button>{' '}
                to join the discussion
              </p>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {comments.map((comment) => (
              <div key={comment._id} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex space-x-3 sm:space-x-4">
                  <Link to={`/${comment.author_id?.username}`} className="flex-shrink-0 group">
                    {comment.author_id?.avatar ? (
                      <img
                        src={comment.author_id.avatar}
                        alt={comment.author_id.username}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
                        <span className="text-blue-600 text-sm sm:text-lg font-medium">
                          {comment.author_id?.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                      <Link 
                        to={`/${comment.author_id?.username}`}
                        className="font-medium text-sm sm:text-base text-gray-900 hover:text-blue-600 transition-colors truncate"
                      >
                        {comment.author_id?.username || 
                         (comment.author_id?.firstName && comment.author_id?.lastName 
                          ? `${comment.author_id.firstName} ${comment.author_id.lastName}`
                          : 'Unknown')}
                      </Link>
                    </div>
                    <p className="text-sm sm:text-base text-gray-800 mb-3">{comment.body}</p>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleCommentVote(comment._id, getCommentVoteStatus(comment) === 'upvoted' ? 'none' : 'upvote')}
                        className={`inline-flex items-center space-x-1 rounded-lg px-2 py-1 transition-colors ${
                          getCommentVoteStatus(comment) === 'upvoted'
                            ? 'text-orange-500 bg-orange-50'
                            : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'
                        }`}
                      >
                        <FaArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm font-medium">{comment.upvotes?.length || 0}</span>
                      </button>
                      <button
                        onClick={() => handleCommentVote(comment._id, getCommentVoteStatus(comment) === 'downvoted' ? 'none' : 'downvote')}
                        className={`inline-flex items-center space-x-1 rounded-lg px-2 py-1 transition-colors ${
                          getCommentVoteStatus(comment) === 'downvoted'
                            ? 'text-blue-500 bg-blue-50'
                            : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                        }`}
                      >
                        <FaArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm font-medium">{comment.downvotes?.length || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-lg text-gray-500">No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostView;
